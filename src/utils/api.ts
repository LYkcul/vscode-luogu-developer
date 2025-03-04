import _ from 'axios'
import { UserStatus } from '@/utils/shared'
import luoguStatusBar from '@/views/luoguStatusBar'
import { cookieConfig, changeCookieByCookies } from '@/utils/files'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import * as vscode from 'vscode'
const luoguJSONName = 'luogu.json';
globalThis.luoguPath = path.join(os.homedir(), '.luogu');
globalThis.luoguJSONPath = path.join(globalThis.luoguPath, luoguJSONName);

export const CSRF_TOKEN_REGEX = /<meta name="csrf-token" content="(.*)">/

export namespace API {
  export const baseURL = 'https://www.luogu.com.cn'
  export const apiURL = '/api'
  export const cookieDomain = 'luogu.com.cn'
  // export const SEARCH_PROBLEM = (pid: string) => `${apiURL}/problem/detail/${pid}`
  export const SEARCH_PROBLEM = (pid: string) => `/problem/${pid}?_contentOnly=1`
  export const SEARCH_CONTESTPROBLEM = (pid: string, cid: string) => `/problem/${pid}?contestId=${cid}&_contentOnly=1`
  export const SEARCH_SOLUTION = (pid: string, page: number) => `/problem/solution/${pid}?page=${page}&_contentOnly=1`
  export const CAPTCHA_IMAGE = `${apiURL}/verify/captcha`
  export const CONTEST = (cid: string) => `/contest/${cid}?_contentOnly=1`
  export const LOGIN_ENDPOINT = `${apiURL}/auth/userPassLogin`
  export const SYNCLOGIN_ENDPOINT = `${apiURL}/auth/syncLogin`
  export const LOGIN_REFERER = `${baseURL}/auth/login`
  export const LOGOUT = `${apiURL}/auth/logout`
  export const FATE = `/index/ajax_punch`
  export const BENBEN = (mode: string, page: number) => `${apiURL}/feed/${mode}?page=${page}`
  export const BenbenReferer = 'https://www.luogu.com.cn/'
  export const BENBEN_POST = `${apiURL}/feed/postBenben`
  export const BENBEN_DELETE = (id: string) => `${apiURL}/feed/delete/${id}`
  export const UNLOCK_ENDPOINT = `${apiURL}/auth/unlock`
  export const ranklist = (cid: string, page: number) => `/fe/api/contest/scoreboard/${cid}?page=${page}`
  export const TRAINLISTDETAIL = (id: any) => `${baseURL}/training/${id}?_contentOnly=1`
  export const SEARCHTRAINLIST = (channel: string, keyword: string, page: number) => `${baseURL}/training/list?type=${channel}&page=${page}&keyword=${encodeURI(keyword)}&_contentOnly=1`
}

export const axios = (() => {
  const axios = _.create({
    baseURL: API.baseURL,
    withCredentials: true,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    proxy: false
  })

  const defaults = axios.defaults;
  if (!defaults.transformRequest) {
    defaults.transformRequest = []
  } else if (!(defaults.transformRequest instanceof Array)) {
    defaults.transformRequest = [defaults.transformRequest];
  }
  defaults.transformRequest.push((data, headers) => {
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'
    return data
  })
  defaults.timeout = 6000;

  return axios
})()

export default axios

export const genCookies = async function () {
  let res = await axios.get(API.baseURL);
  changeCookieByCookies(res.headers['set-cookie']);
}

export const csrfToken = async () =>
  axios.get(API.baseURL, cookieConfig())
    .then(res => {
      const result = CSRF_TOKEN_REGEX.exec(res.data)
      console.log(result ? result[1].trim() : null);
      return result ? result[1].trim() : null
    }).catch(() => '')

export const captcha = async () =>
  axios.get(API.CAPTCHA_IMAGE, {
    params: {
      '_t': new Date().getTime()
    },
    responseType: 'arraybuffer',
    ...cookieConfig()
  })
    .then(resp => resp.data ? Buffer.from(resp.data, 'binary') : null).catch(err => {
      if (err.response) {
        throw err.response.data;
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err;
      }
    })
export const searchProblem = async (pid: string) =>
  axios.get(API.SEARCH_PROBLEM(pid), cookieConfig()).then(res => res.data)
    .then(res => {
      if (res.code !== 200) {
        throw Error(res.currentData.errorMessage)
      }
      return res.currentData.problem
    }).catch(err => {
      if (err.response) {
        throw err.response.data;
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err;
      }
    })

export const searchContestProblem = async (pid: string, cid: string) =>
  axios.get(API.SEARCH_CONTESTPROBLEM(pid, cid), cookieConfig()).then(res => res.data)
    .then(res => {
      if (res.code !== 200) {
        throw Error(res.currentData.errorMessage)
      }
      return res.currentData.problem
    }).catch(err => {
      if (err.response) {
        throw err.response.data
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err
      }
    })

export const searchContest = async (cid: string) =>
  axios.get(API.CONTEST(cid), cookieConfig())
    .then(res => res?.data?.currentData).then(async res => {
      // console.log(res)
      if ((res || null) === null) { throw Error('比赛不存在') }
      return res
    }).catch(err => {
      if (err.response) {
        throw err.response.data;
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err;
      }
    })

export const searchSolution = async (pid: string) =>
  axios.get(API.SEARCH_SOLUTION(pid, 1), cookieConfig())
    .then(res => res.data).then(async (res) => {
      console.log(res)
      if ((res.currentData.solutions || null) === null) { throw Error('题目不存在') }
      const problem = res.currentData.problem;
      res = res.currentData.solutions
      if (res.count <= res.perPage) {
        return {
          solutions: res.result,
          problem: problem
        };
      }
      let result: any[] = res.result;
      const pages = Math.ceil(res.count / res.perPage);
      for (let i = 2; i <= pages; i++) {
        const currentPage = await axios.get(API.SEARCH_SOLUTION(pid, i), cookieConfig())
          .then(res => res.data.currentData.solutions || null).catch(err => {
            if (err.response) {
              throw err.response.data;
            } else if (err.request) {
              throw Error('请求超时，请重试')
            } else {
              throw err;
            }
          })
        if (currentPage) {
          currentPage.result.forEach(data => { result.push(data); })
        } else {
          // ???
          // throw Error('获取题解失败');
        }
      }
      return {
        solutions: result,
        problem: problem
      };
    }).catch(err => {
      if (err.response) {
        throw err.response.data;
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err;
      }
    })

export const searchTraininglist = async (type: string, keyword: string, page: number) =>
  axios.get(API.SEARCHTRAINLIST(type, keyword, page),cookieConfig())
    .then(res => res?.data?.currentData).then(async res => {
      // console.log(res)
      if ((res || null) === null) { throw Error('题单不存在') }
      return res
    }).catch(err => {
      if (err.response) {
        throw err.response.data;
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err;
      }
    })

export const searchTrainingdetail = async (id: any) =>
  axios.get(API.TRAINLISTDETAIL(id),cookieConfig())
    .then(res => res?.data?.currentData).then(async res => {
      // console.log(res)
      if ((res || null) === null) { throw Error('题单不存在') }
      return res
    }).catch(err => {
      if (err.response) {
        throw err.response.data;
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err;
      }
    })

/**
 * @api 登录
 * @async
 * @param {string} username 用户名
 * @param {string} password 密码
 * @param {string} captcha 验证码
 */
export const login = async (username, password, captcha) => {
  const csrf = await csrfToken()

  return await axios.post(API.LOGIN_ENDPOINT, {
    username,
    password,
    captcha
  }, {
    headers: {
      'Referer': API.LOGIN_REFERER,
      'X-CSRF-Token': csrf,
      ...cookieConfig().headers
    }
  })
}

export const unlock = async (code) => {
  const csrf = await csrfToken()

  return await axios.post(API.UNLOCK_ENDPOINT, {
    code
  }, {
    headers: {
      'Referer': API.LOGIN_REFERER,
      'X-CSRF-Token': csrf,
      ...cookieConfig().headers
    }
  })
}


export const getStatus = async () => {
  const ret = (await fetchHomepage()).currentUser
  if (ret) {
    globalThis.islogged = true
    luoguStatusBar.updateStatusBar(UserStatus.SignedIn)
    return UserStatus.SignedIn.toString()
  } else {
    globalThis.islogged = false
    luoguStatusBar.updateStatusBar(UserStatus.SignedOut)
    return UserStatus.SignedOut.toString()
  }
}

export const fetchResult = async (rid: number) =>
  axios.get(`/record/${rid}?_contentOnly=1`,cookieConfig())
    .then(data => data?.data.currentData).catch(err => {
      if (err.response) {
        throw err.response.data;
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err;
      }
    })

export const fetchHomepage = async () =>
  axios.get(`/user/1?_contentOnly=1`,cookieConfig())
    .then(data => data?.data).catch(err => {
      if (err.response) {
        throw err.response.data;
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err;
      }
    })
export const logout = async () => axios.post(API.LOGOUT, '', {
  headers: {
    'X-CSRF-Token': await csrfToken(),
    'Referer': API.baseURL,
    'Origin': API.baseURL,
    ...cookieConfig().headers
  }
}).then(data => data?.data).catch(err => {
  if (err.response) {
    throw err.response.data;
  } else if (err.request) {
    throw Error('请求超时，请重试')
  } else {
    throw err;
  }
})

export const getFate = async () =>
  axios.get(API.FATE,cookieConfig())
    .then(data => data?.data).catch(err => {
      if (err.response) {
        throw err.response.data;
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err;
      }
    })

export const fetchRecords = async () =>
  axios.get(`/record/list?_contentOnly=1`,cookieConfig())
    .then(data => data?.data).catch(err => {
      if (err.response) {
        throw err.response.data;
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err;
      }
    })

export const searchUser = async (keyword: string) =>
  axios.get(`/api/user/search?keyword=${keyword}`,cookieConfig())
    .then(data => data?.data).catch(err => {
      if (err.response) {
        throw err.response.data;
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err;
      }
    })

export const fetchBenben = async (mode: string, page: number) =>
  axios.get(API.BENBEN(mode, page), {
    headers: {
      'X-CSRF-Token': await csrfToken(),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      ...cookieConfig().headers
    },
  }).then(data => data?.data).catch(err => {
    if (err.response) {
      throw err.response.data;
    } else if (err.request) {
      throw Error('请求超时，请重试')
    } else {
      throw err;
    }
  })

export const postBenben = async (benbenText: string) =>
  axios.post(API.BENBEN_POST, {
    'content': benbenText
    }, {
    headers: {
      'X-CSRF-Token': await csrfToken(),
      'Referer': API.BenbenReferer,
      ...cookieConfig().headers
    }
  }).then(data => data?.data).catch(err => {
    if (err.response) {
      throw err.response.data;
    } else if (err.request) {
      throw Error('请求超时，请重试')
    } else {
      throw err;
    }
  })

export const deleteBenben = async (id: string) =>
  axios.post(API.BENBEN_DELETE(id), {}, {
    headers: {
      'X-CSRF-Token': await csrfToken(),
      'Referer': API.BenbenReferer,
      ...cookieConfig().headers
    }
  }).then(data => data?.data).catch(err => {
    if (err.response) {
      throw err.response.data;
    } else if (err.request) {
      throw Error('请求超时，请重试')
    } else {
      throw err;
    }
  })

export const userIcon = async (uid: number) =>
  axios.get(`https://cdn.luogu.com.cn/upload/usericon/${uid}.png`, { responseType: 'arraybuffer',...cookieConfig() })
    .then(resp => resp.data ? Buffer.from(resp.data, 'binary') : null)
    .catch(() => null)

export const postVote = async (id: number, type: number) =>
  axios.post(`/api/blog/vote/${id}`, { 'Type': type,...cookieConfig() })
    .then(data => data?.data)
    .catch(err => {
      if (err.response) {
        return err.response.data;
      } else if (err.request) {
        throw Error('请求超时，请重试')
      } else {
        throw err;
      }
    })

export const parseProblemID = async (name: string) => {
  const regexs = new Array(/(AT_\w*?_\w{1,2})/i, /(CF[0-9]{1,4}[A-Z][0-9]{0,1})/i, /(SP[0-9]{1,5})/i, /(P[0-9]{4})/i, /(UVa[0-9]{1,5})/i, /(U[0-9]{1,6})/i, /(T[0-9]{1,6})/i, /(B[0-9]{4})/i);
  for (const regex of regexs) {
    const m = regex.exec(name);
    if (m !== null) {
      let ret = '';
      m.forEach((match) => { ret = match; });
      if (ret !== '') { return ret; }
    }
  }
  return '';
}

export const parseUID = async (name: string) => {
  const regex = /([0-9]{1,7})/i
  const m = regex.exec(name);
  if (m !== null) {
    let ret = '';
    m.forEach((match) => { ret = match; });
    if (ret !== '') { return ret; }
  }
  return '';
}

export const removeDir = (dir: any, cb: any) => {
  fs.readdir(dir, function (err, files) {
    if (err) {
      console.error(err)
      throw err
    }
    const next = (index: any) => {
      if (index === files.length) {
        return fs.rmdir(dir, cb)
      }
      let newPath = path.join(dir, files[index])
      console.log(newPath)
      fs.stat(newPath, function (err, stat) {
        if (err) {
          console.log(err)
        }
        if (stat.isDirectory()) {
          removeDir(newPath, () => next(index + 1))
        } else {
          fs.unlink(newPath, function (err) {
            if (err) {
              console.error(err)
            }
            next(index + 1)
          })
        }
      })
    }
    next(0)
  })
}

export const prettyTime = (time: number) => {
  let mistiming = Math.round(new Date().getTime() / 1000) - time;
  const postfix = mistiming > 0 ? '前' : '后'
  mistiming = Math.abs(mistiming)
  const arrr = ['年', '个月', '星期', '天', '小时', '分钟', '秒'];
  const arrn = [31536000, 2592000, 604800, 86400, 3600, 60, 1];

  for (let i = 0; i < 7; i++) {
    const inm = Math.floor(mistiming / arrn[i])
    if (inm !== 0) {
      return inm + arrr[i] + postfix
    }
  }
  return undefined
}

export const getResourceFilePath = (webview: vscode.Webview, relativePath: string) => {
  const diskPath = vscode.Uri.file(path.join(globalThis.resourcesPath, relativePath));
  return webview.asWebviewUri(diskPath);
}

const delay = (t: number) => new Promise(resolve => setTimeout(resolve, t))
export const loadUserIcon = async (uid: number) => {
  // tslint:disable-next-line: radix
  if (fs.existsSync(path.join(globalThis.luoguPath, `${uid}.png`)) && fs.existsSync(path.join(globalThis.luoguPath, `${uid}`)) && ((new Date()).getTime() - parseInt(fs.readFileSync(path.join(globalThis.luoguPath, `${uid}`)).toString())) <= 21600000) {
    return fs.readFileSync(path.join(globalThis.luoguPath, `${uid}.png`))
  } else {
    let image = await userIcon(uid);
    let cnt = 0;
    while (!image && cnt <= 10) {
      await delay(200)
      image = await userIcon(uid);
      cnt++;
    }
    if (image === null) {
      vscode.window.showErrorMessage('获取用户头像失败')
      return
    }
    const ret = image.toString('base64');
    const time = (new Date()).getTime();
    fs.writeFileSync(path.join(globalThis.luoguPath, `${uid}.png`), ret);
    fs.writeFileSync(path.join(globalThis.luoguPath, `${uid}`), time.toString())
    console.log(`Get usericon; uid: ${uid}`);
    return ret
  }
}
export const formatTime = (date: Date, fmt: string) => {
  const o = {
    'y+': date.getFullYear(),
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    'S+': date.getMilliseconds()
  };
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      if (k === 'y+') {
        fmt = fmt.replace(RegExp.$1, ('' + o[k]).substr(4 - RegExp.$1.length));
      } else if (k === 'S+') {
        let lens = RegExp.$1.length;
        lens = lens === 1 ? 3 : lens;
        fmt = fmt.replace(RegExp.$1, ('00' + o[k]).substr(('' + o[k]).length - 1, lens));
      } else {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
      }
    }
  }
  return fmt;
}
export const getRanklist = async (cid: string, page: number) => {
  return axios.get(API.ranklist(cid, page),cookieConfig())
    .then(res => res.data).catch(err => { throw err })
}
export const changeTime = (x: number) => {
  let res = ''
  if (x >= 86400) {
    res += Math.floor(x / 86400).toString() + ' 天 '
    x -= Math.floor(x / 86400) * 86400
  }
  if (x >= 3600) {
    res += Math.floor(x / 3600).toString() + ' 小时 '
    x -= Math.floor(x / 3600) * 3600
  }
  if (x >= 60) {
    res += Math.floor(x / 60).toString() + ' 分 '
    x -= Math.floor(x / 60) * 60
  }
  if (x > 0) {
    res += x.toString() + ' 秒 '
  }
  return res
}

export const getErrorMessage = (err: unknown) => {
  if (err instanceof Error)
    return err.message
  return String(err)
}

/**
 * @api 提交代码
 * @async
 * @param {string} id 提交id
 * @param {string} code 代码
 * @param {number} language 选择语言
 * @param {boolean} enableO2 是否启用O2优化
 *
 * @returns {number} 测评id
 */
export async function submitCode(id: string, code: string, language = 0, enableO2 = false): Promise<any> {
  const url = `/fe/api/problem/submit/${id}`;
  return axios.post(url, {
    'code': code,
    'lang': language,
    'enableO2': enableO2,
    'verify': ''
  }, {
    headers: {
      'X-CSRF-Token': await csrfToken(),
      'Referer': `${API.baseURL}/problem/${id}`,
      ...cookieConfig().headers
    }
  }).then(res => {
    if (res.status === 200) {
      return res.data.rid;
    } else if (res.status === 401) {
      vscode.window.showErrorMessage('您没有登录');
      throw Error('您没有登录');
    } else {
      throw res.data;
    }
  }).catch(err => {
    if (err.response) {
      throw err.response.data.data ?? err.response.data;
    } else if (err.request) {
      throw new Error('请求超时，请重试')
    } else {
      throw err;
    }
  }).catch(err => {
    console.error(err)
    throw err
  });
}
