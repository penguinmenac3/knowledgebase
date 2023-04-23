import { PageManager } from './webui/pagemanager'
import { STRINGS, setupLanguage } from './language/default'
import { Search } from './views/search'
import { Login } from './views/login'
import { Edit } from './views/edit'

import './style.css'

function main() {
  setupLanguage()
  document.getElementsByTagName("title")[0].innerHTML = STRINGS.APPNAME

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