import { STRINGS, setupLanguage } from './language/default'

import './style.css'

function main() {
  setupLanguage()
  document.getElementsByTagName("title")[0].innerHTML = STRINGS.APPNAME
}

main()