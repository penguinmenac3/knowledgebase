import { PageManager } from './webui/pagemanager'
import { STRINGS, setupLanguage } from './language/default'
import { Login, tryReconnectToLastSession } from './views/login'
import { Search } from './views/search'
import { Edit } from './views/edit'
import { Settings } from './views/settings'

import './style.css'

async function main() {
  setupLanguage()
  document.getElementsByTagName("title")[0].innerHTML = STRINGS.APPNAME
  await tryReconnectToLastSession()
  new PageManager(
    "search",
    {
      search: new Search(),
      login: new Login(),
      edit: new Edit(),
    }
  )
  new Settings()
}

main()
