import './webui/core.css'
import './webui/colors.css'
import { STRINGS, setupLanguage } from './language/default'
import { reconnectAllSessions, setPrefix } from './webfs/client/login/login'
import { PageManager } from './webui/pagemanager'
import { MasterDetailView, ToolbarItem } from './webui/components/master-detail-view'
import { Module } from './webui/module'
import { FileTree } from './components/filetree'
import { Viewer } from './components/viewer'
import { AIChat } from './components/ai'
import { LastModified } from './components/lastmodified'
import { SettingsPopup } from './components/settings'
import { iconFolder, iconChat, iconHistory } from './icons'


async function main() {
  setupLanguage()
  setPrefix("kb")
  document.getElementsByTagName("title")[0].innerHTML = STRINGS.APPNAME
  reconnectAllSessions()
  
  // Create master content map with toolbar items
  const masterContentMap = new Map<ToolbarItem, Module<HTMLElement>>();
  let fileTree = new FileTree()
  masterContentMap.set(
    {id: "filetree", hint: "File Tree", icon: iconFolder}, fileTree
  )
  masterContentMap.set(
    {id: "lastmodified", hint: "Last Modified", icon: iconHistory}, new LastModified()
  )
  masterContentMap.set(
    {id: "chat", hint: "Chat", icon: iconChat}, new AIChat()
  )

  new PageManager(
    "main&search=&view=",
    {
      main: new MasterDetailView(masterContentMap, new Viewer(), () => new SettingsPopup()),
    }
  )
}

main()
