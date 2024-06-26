import { PageManager } from './webui/pagemanager'
import { STRINGS, setupLanguage } from './language/default'
import { Login, reconnectAllSessions, setPrefix } from './webfs/client/login/login'
import { Search } from './views/search'
import { Edit } from './views/edit/edit'

import './style.css'
import './webui/colors.css'

async function main() {
  setupLanguage()
  setPrefix("kb")
  document.getElementsByTagName("title")[0].innerHTML = STRINGS.APPNAME
  if (localStorage.kb_autologin == 'true') {
    reconnectAllSessions()
  }
  new PageManager(
    "search&q=/",
    {
      search: new Search(),
      login: new Login(),
      edit: new Edit(),
    }
  )
}

main()
