import SuperCommand from '../SuperCommand'
import * as vscode from 'vscode'

export default new SuperCommand({
  onCommand: '',
  handle: async () => {
  }
})

const generategeneralHTML = async () => {
  return `
  <div>
    <script>
    var channel=0;
    function search() {
      var keyword=document.getElementById("search").value;
      
    }
    function changechannel() {
      if(channel){
        document.getElementById("select").style="display:none";
        document.getElementById("user").style="color: rgb(0,0,0);font-size: large;";
        document.getElementById("User").style="";
        document.getElementById("official").style="";
        document.getElementById("office").style="color: rgb(255,255,255);font-size: large;";
        document.getElementById("Office").style="background-color: rgb(52,152,219);";
      } else {
        document.getElementById("official").style="display:none";
        document.getElementById("office").style="color: rgb(0,0,0);font-size: large;";
        document.getElementById("Office").style="";
        document.getElementById("select").style="";
        document.getElementById("user").style="color: rgb(255,255,255);font-size: large;";
        document.getElementById("User").style="background-color: rgb(52,152,219);"
      }
      channel=1-channel;
    }
    </script>
    <section>
      <table width="100%">
        <tr>
          <td align="left" width="100%" nowrap>
            <form>
              <span>
                <h2 style='display: inline-block'>查找题单</h2>
                <input style="border-radius:4px;border:1px solid #000;width:300px; margin:0 auto; box-shadow: 0 4px 6px rgba(50, 50, 93, .08), 0 1px 3px rgba(0, 0, 0, .05); transition: box-shadow .15s ease; padding: .5em;" type="text" id="search">
                <button onmouseout="this.style.backgroundColor='white';" onmouseover="this.style.backgroundColor='rgb(0,195,255)';" onclick="searchlist()">搜索</button>
              </span>
            </form>
          </td>
        </tr>
      </table>
      <span style="background-color: rgb(52,152,219);" id="Office">
        <a style="color: rgb(255,255,255); font-size: large;" title="官方精选" href="javascript:void(0)" onclick="changechannel()" id="office">官方精选</a>
      </span>
      &nbsp;&nbsp;&nbsp;
      <span>
        <a style="color: rgb(0,0,0);font-size: large;" title="用户分享" href="javascript:void(0)" onclick="changechannel()" id="user">用户分享</a>
      </span>
    </section>
  </div>
  `
}