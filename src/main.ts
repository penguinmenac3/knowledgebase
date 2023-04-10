import { PageManager } from './framework/pagemanager'
import { STRINGS, setupLanguage } from './language/default'
import { Overview } from './views/overview'

import './style.css'

function main() {
  setupLanguage()
  document.getElementsByTagName("title")[0].innerHTML = STRINGS.APPNAME

  let pageManager = new PageManager(
    "overview",
    {
      overview: new Overview()
    }
  )
}

main()