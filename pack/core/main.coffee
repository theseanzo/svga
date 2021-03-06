Take ["Registry", "Scene", "DOMContentLoaded"], (Registry, Scene)->
  
  # This is the very first code that touches the DOM. It crawls the entire DOM and:
  # 1. Makes structural changes to prepare things for animation.
  # 2. Returns a tree of DOM references that we'll link Symbols to.
  svgData = Scene.crawl document.getElementById "root"
  
  # We're done the initial traversal of the SVG. It's now safe for systems to mutate it.
  Make "SVGReady"
  
  # We need to wait a bit for ScopeProcessors
  setTimeout ()->
  
    # By now, we're assuming all ScopeProcessors are ready.
    Registry.closeRegistration "ScopeProcessor"
    
    # Inform all systems that it's now safe to use Scope.
    Make "ScopeReady"
    
    # By now, we're assuming all Controls are ready.
    Registry.closeRegistration "Control"
    
    # Inform all systems that we've just finished setting up Controls.
    Make "ControlReady"
    
    # By now, we're assuming all Symbols are ready.
    Registry.closeRegistration "Symbol"
    
    # Use the DOM references collected earlier to build our Scene tree.
    Scene.build svgData
    svgData = null # Free this memory
    
    # Inform all systems that we've just finished setting up the scene.
    Make "SceneReady"
    
    # Inform all systems that bloody everything is done.
    Make "AllReady"
