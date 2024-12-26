import { PageManager } from './webui/pagemanager'
import { STRINGS, setupLanguage } from './language/default'
import { reconnectAllSessions, setPrefix } from './webfs/client/login/login'
import { Search } from './views/search'

import './style.css'
import './webui/colors.css'
import { MasterDetailView } from './webui/components/master-detail-view'
import { Edit } from './views/edit/edit'
import { AIChat } from './views/ai'

async function main() {
  setupLanguage()
  setPrefix("kb")
  document.getElementsByTagName("title")[0].innerHTML = STRINGS.APPNAME
  reconnectAllSessions()
  new PageManager(
    "main&search=%2F&view=",
    {
      main: new MasterDetailView(new Search(), new Edit(), new AIChat()),
    }
  )
}

main()
