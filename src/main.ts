import { PageManager } from './webui/pagemanager'
import { STRINGS, setupLanguage } from './language/default'
import { Login, reconnectAllSessions } from './views/login'
import { Search } from './views/search'
import { Edit } from './views/edit/edit'

import './style.css'

async function main() {
  setupLanguage()
  document.getElementsByTagName("title")[0].innerHTML = STRINGS.APPNAME
  if (localStorage.kb_autologin == 'true') {
    reconnectAllSessions()
  }
  new PageManager(
    "search",
    {
      search: new Search(),
      login: new Login(),
      edit: new Edit(),
    }
  )
}

main()
