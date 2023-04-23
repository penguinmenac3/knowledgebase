import { PageManager } from './webui/pagemanager'
import { STRINGS, setupLanguage } from './language/default'
import { Search } from './views/search'

import './style.css'
import { Login } from './views/login'

function main() {
  setupLanguage()
  document.getElementsByTagName("title")[0].innerHTML = STRINGS.APPNAME

  new PageManager(
    "search",
    {
      search: new Search(),
      login: new Login(),
    }
  )
}

main()