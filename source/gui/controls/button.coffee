Take ["Control", "GUI", "Input", "SVG", "Tween"], (Control, GUI, Input, SVG, Tween)->
  gui = GUI.ControlPanel

  Control "button", (elm, props)->
    handlers = []
    
    SVG.attrs elm, ui: true
    
    bg = SVG.create "rect", elm,
      fill:"hsl(220, 12%, 80%)"
      x: gui.pad
      y: gui.pad
      rx: gui.borderRadius
    
    label = SVG.create "text", elm,
      textContent: props.name
      fill: "hsl(220, 0%, 30%)"

    w = label.getComputedTextLength()
    h = 10
    
    c = 1
    tickBG = (v)->
      c = v
      SVG.attrs bg, fill: "hsl(220, 12%, #{v*80}%)"
    
    depress = ()-> Tween c, 0.9, 0, tickBG
    release = ()-> Tween 0.9, 1, .2, tickBG
    
    
    Input elm,
      click: ()-> handler() for handler in handlers
      down: depress
      drag: depress
      up: release
    
    
    return scope =
      attach: (props)-> handlers.push props.action if props.action?
      preferredSize: ()-> w:w, h:h
      resize: (w, h)->
        SVG.attrs bg, width:w-gui.pad*2, height:h-gui.pad*2
        SVG.attrs label, x: w/2, y: h/2 + 8
