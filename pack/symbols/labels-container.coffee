Take ["Reaction", "Symbol", "SVG"], (Reaction, Symbol, SVG)->
  Symbol "Labels", ["labelsContainer"], (svgElement)->
    for c in svgElement.querySelectorAll "[fill]"
      c.removeAttributeNS null, "fill"
    
    return scope =
      setup: ()->
        Reaction "Labels:Hide", ()-> scope.alpha = false
        Reaction "Labels:Show", ()-> scope.alpha = true
        Reaction "Background:Set", (v)->
          l = (v/2 + .8) % 1
          SVG.attr svgElement, "fill", "hsl(227, 4%, #{l*100}%)"
            
