Take ["Action", "Reaction"], (Action, Reaction)->
  showing = false
  
  Reaction "Help:Hide", ()-> showing = false
  Reaction "Help:Show", ()-> showing = true

  Reaction "Help:Toggle", ()->
    Action if showing then "Help:Hide" else "Help:Show"
  
  Reaction "Settings:Show", ()->
    Action "Help:Hide"
