import './webui/core.css'
import './webui/colors.css'
import { STRINGS, setupLanguage } from './language/default'
import { reconnectAllSessions, setPrefix } from './webfs/client/login/login'
import { PageManager } from './webui/pagemanager'
import { MasterDetailView } from './webui/components/master-detail-view'
import { FileTree } from './components/filetree'
import { Viewer } from './components/viewer'
import { AIChat } from './components/ai'


async function main() {
  setupLanguage()
  setPrefix("kb")
  document.getElementsByTagName("title")[0].innerHTML = STRINGS.APPNAME
  reconnectAllSessions()
  new PageManager(
    "main&search=%2F&view=",
    {
      main: new MasterDetailView(new FileTree(), new Viewer(), new AIChat()),
    }
  )
}

main()
