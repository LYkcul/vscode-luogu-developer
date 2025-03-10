import * as vscode from 'vscode'
import * as path from 'path'
// @ts-ignore
import SuperCommand from '../SuperCommand'
import { parseProblemID } from '@/utils/api'
import showProblem from '@/utils/showProblem'

export default new SuperCommand({
  onCommand: 'searchProblem',
  handle: async () => {
    while (!globalThis.init);
    const edtior = vscode.window.activeTextEditor;
    let defaultID = '';
    if (edtior) {
      defaultID = await parseProblemID(path.parse(edtior.document.fileName).base);
      defaultID = defaultID.toUpperCase();
    }
    if (defaultID === '') {
      defaultID = globalThis.pid;
    }
    const pid = (vscode.workspace.getConfiguration('luogu').get<boolean>('checkFilenameAsProblemID') && defaultID !== '') ? defaultID : await vscode.window.showInputBox({
      placeHolder: '输入题号',
      value: defaultID,
      ignoreFocusOut: true
    }).then(res => res ? res.toUpperCase() : null);
    if (!pid) {
      return;
    }
    console.log(pid)
    const regex = /(AT_\w*?_\w{1,2}|B[0-9]{4}|CF[0-9]{1,4}[A-Z][0-9]{0,1}|SP[0-9]{1,5}|P[0-9]{4}|UVA[0-9]{1,5}|U[0-9]{1,6}|T[0-9]{1,6})/
    console.log(regex.test(pid))
    if (!regex.test(pid)) {
      vscode.window.showErrorMessage('题目不存在')
      return
    }
    globalThis.pid = pid;
    await showProblem(pid, '')
  }
})
