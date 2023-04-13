import { PageManager } from './framework/pagemanager'
import { STRINGS, setupLanguage } from './language/default'
import { Overview } from './views/overview'

import './style.css'
import { Login } from './views/login'

function main() {
  setupLanguage()
  document.getElementsByTagName("title")[0].innerHTML = STRINGS.APPNAME

  new PageManager(
    "overview",
    {
      overview: new Overview(),
      login: new Login(),
    }
  )
}

main()