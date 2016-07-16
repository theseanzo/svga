Take ["Component","GUI","PointerInput","Reaction","Resize","SVG","TRS","SVGReady"],
(      Component , GUI , PointerInput , Reaction , Resize , SVG , TRS)->
  requested = []
  instances = {}
  menu = null
  settings = null
  help = null
  offsetX = 0
  
  
  topBar = SVG.create "g", SVG.root, class: "TopBar"
  bg = SVG.create "rect", topBar, height: GUI.TopBar.height, fill: "url(#TopBarGradient)"
  SVG.createGradient "TopBarGradient", false, "#35488d", "#5175bd", "#35488d"
  container = TRS SVG.create "g", topBar, class: "Elements"
    
  # Place us above the click-to-focus element
  Reaction "ScopeReady", ()-> SVG.append SVG.root, topBar
  
  
  TopBar = (args...)->
    # This is used by TopBar definitions
    if typeof args[1] is "object"
      Component.make "TopBar", args...
    
    # Called by, most likely, the setup function in the content creator's "root" symbol
    else
      requested.push args...
  
  TopBar.height = GUI.TopBar.height

  
  Reaction "ScopeReady", ()->
    definitions = Component.take "TopBar"
    construct i, name, definitions[name] for name, i in requested
    menu = construct -1, "Menu", definitions["Menu"]
    settings = construct -1, "Settings", definitions["Settings"]
    help = construct -1, "Help", definitions["Help"]
    Resize resize
  
  resize = ()->
    SVG.attrs bg, width: window.innerWidth
    TRS.move container, window.innerWidth/2 - offsetX/2
    instance.api.resize?() for instance in instances
    TRS.move menu.element, 0
    TRS.move help.element, window.innerWidth - GUI.TopBar.Help.inset
    TRS.move settings.element, window.innerWidth - GUI.TopBar.Settings.inset
    Make "TopBarReady" unless Take "TopBarReady"
  
  construct = (i, name, api)->
    throw "Unknown TopBar button name: #{name}" unless api?
    
    source = document.getElementById(name.toLowerCase())
    throw "TopBar icon not found for id: ##{name}" if not source?
    
    custom = i is -1
    
    buttonPad = if custom then GUI.TopBar.buttonPadCustom else GUI.TopBar.buttonPadStandard
    
    if custom
      api.element = TRS SVG.create "g", topBar, class: "Element", ui: true
    else
      api.element = TRS SVG.create "g", container, class: "Element", ui: true
    
    instance = element:api.element, i:i, name:name, api:api
    instances[name] = instance unless custom
    
    # The api can disable these by setting the property to false, or providing its own values
    api.bg ?= SVG.create "rect", api.element, class: "BG", height: GUI.TopBar.height, fill: "transparent"
    api.icon ?= TRS SVG.clone source, api.element
    api.text ?= TRS SVG.create "text", api.element, "font-size": 14, fill: "#FFF", textContent: api.label or name.toUpperCase()
    
    iconRect = api.icon.getBoundingClientRect()
    textRect = api.text.getBoundingClientRect()
    iconX = buttonPad
    iconY = 0
    textX = buttonPad + iconRect.width + GUI.TopBar.iconPad
    buttonWidth = textX + textRect.width + buttonPad
    TRS.abs api.icon, x:iconX, y:iconY
    TRS.move api.text, textX, GUI.TopBar.height/2 + textRect.height/2 - 3
    SVG.attrs api.bg, width: buttonWidth
    if not custom
      TRS.move api.element, offsetX
      offsetX += buttonWidth
    api.setup? api.element
    PointerInput.addClick api.element, api.click if api.click?
    PointerInput.addMove api.element, api.move if api.move?
    PointerInput.addDown api.element, api.down if api.down?
    PointerInput.addUp api.element, api.up if api.up?
    PointerInput.addOver api.element, api.over if api.over?
    PointerInput.addOut api.element, api.our if api.out?
    
    instance # Composable
  
  
  Make "TopBar", TopBar
