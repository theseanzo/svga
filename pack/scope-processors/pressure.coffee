# Depends on style

Take ["Pressure", "Registry", "ScopeCheck", "SVG"], (Pressure, Registry, ScopeCheck, SVG)->
  Registry.add "ScopeProcessor", (scope)->
    ScopeCheck scope, "pressure"
    
    pressure = null
    
    Object.defineProperty scope, 'pressure',
      get: ()-> pressure
      set: (val)->
        if pressure isnt val
          pressure = val
          if scope._setPressure?
            scope._setPressure pressure
          else
            scope.fill = Pressure scope.pressure
