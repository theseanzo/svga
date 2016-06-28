(function() {
  var Arrow, ArrowsContainer, Button, Edge, SVGMask, Segment, getParentInverseTransform,
    slice = [].slice,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Make("button", Button = function(svgElement) {
    var scope;
    return scope = {
      callbacks: [],
      setup: function() {
        return svgElement.addEventListener("click", scope.clicked);
      },
      setCallback: function(callback) {
        return scope.callbacks.push(callback);
      },
      clicked: function() {
        var callback, len, m, ref, results;
        ref = scope.callbacks;
        results = [];
        for (m = 0, len = ref.length; m < len; m++) {
          callback = ref[m];
          results.push(callback());
        }
        return results;
      }
    };
  });

  Take(["Ease", "Vector", "PointerInput"], function(Ease, Vector, PointerInput) {
    var Crank;
    return Make("crank", Crank = function(svgElement) {
      var scope;
      return scope = {
        deadbands: [],
        unmapped: 0,
        domainMin: 0,
        domainMax: 359,
        rangeMin: -1,
        rangeMax: 1,
        oldAngle: 0,
        newAngle: 0,
        progress: 0,
        rotation: 0,
        callback: function() {},
        setup: function() {
          return PointerInput.addDown(svgElement, scope.mouseDown);
        },
        setCallback: function(callBackFunction) {
          return scope.callback = callBackFunction;
        },
        getValue: function() {
          return Ease.linear(scope.transform.angle, scope.domainMin, scope.domainMax, scope.rangeMin, scope.rangeMax);
        },
        setValue: function(input) {
          return scope.unmapped = Ease.linear(input, scope.domainMin, scope.domainMax, scope.rangeMin, scope.rangeMax);
        },
        setDomain: function(min, max) {
          scope.domainMin = min;
          scope.domainMax = max;
          if (scope.transform.angle < scope.domainMin) {
            return scope.transform.angle = scope.rotation = scope.unmapped = scope.domainMin;
          } else if (scope.transform.angle > scope.domainMax) {
            return scope.transform.angle = scope.rotation = scope.unmapped = scope.domainMax;
          }
        },
        setRange: function(min, max) {
          scope.rangeMin = min;
          return scope.rangeMax = max;
        },
        addDeadband: function(min, set, max) {
          var deadband;
          deadband = {
            min: min,
            set: set,
            max: max
          };
          scope.deadbands.push(deadband);
          return deadband;
        },
        begin: function(e) {
          var clientRect, mousePos;
          clientRect = svgElement.getBoundingClientRect();
          scope.position = Vector.fromRectPos(clientRect);
          scope.position.x += clientRect.width / 2;
          scope.position.y += clientRect.height / 2;
          mousePos = Vector.fromEventClient(e);
          return scope.oldAngle = Math.atan2(mousePos.y - scope.position.y, mousePos.x - scope.position.x);
        },
        compute: function(e) {
          var mousePos, progress;
          mousePos = Vector.fromEventClient(e);
          scope.newAngle = Math.atan2(mousePos.y - scope.position.y, mousePos.x - scope.position.x);
          progress = scope.newAngle - scope.oldAngle;
          if (progress > Math.PI) {
            progress += -2 * Math.PI;
          } else {
            if (progress < -Math.PI) {
              progress += 2 * Math.PI;
            } else {
              progress += 0;
            }
          }
          scope.unmapped += progress * 180 / Math.PI;
          return scope.update();
        },
        update: function() {
          var band, len, m, ref, rotation;
          scope.unmapped = Math.max(scope.domainMin, Math.min(scope.domainMax, scope.unmapped));
          rotation = scope.unmapped;
          ref = scope.deadbands;
          for (m = 0, len = ref.length; m < len; m++) {
            band = ref[m];
            if (rotation > band.min && rotation < band.max) {
              rotation = band.set;
            }
          }
          scope.transform.angle = rotation;
          scope.oldAngle = scope.newAngle;
          if (typeof callback !== "undefined" && callback !== null) {
            return callback();
          }
        },
        mouseDown: function(e) {
          PointerInput.addMove(scope.root.getElement(), scope.mouseMove);
          PointerInput.addUp(scope.root.getElement(), scope.mouseUp);
          PointerInput.addUp(window, scope.mouseUp);
          scope.begin(e);
          return scope.compute(e);
        },
        mouseMove: function(e) {
          return scope.compute(e);
        },
        mouseUp: function(e) {
          PointerInput.removeMove(scope.root.getElement(), scope.mouseMove);
          PointerInput.removeUp(scope.root.getElement(), scope.mouseUp);
          return PointerInput.removeUp(window, scope.mouseUp);
        }
      };
    });
  });

  Take(["Symbol", "SymbolsReady"], function(Symbol) {
    return Symbol("DefaultElement", [], function(svgElement) {
      var ref, scope, textElement;
      textElement = (ref = svgElement.querySelector("text")) != null ? ref.querySelector("tspan") : void 0;
      return scope = {
        setText: function(text) {
          return textElement != null ? textElement.textContent = text : void 0;
        }
      };
    });
  });

  Take(["PointerInput", "PureDom", "SVGTransform", "Vector", "DOMContentLoaded"], function(PointerInput, PureDom, SVGTransform, Vector) {
    var Draggable, getParentRect, mouseConversion, updateMousePos, vecFromEventGlobal;
    vecFromEventGlobal = function(e) {
      return Vector.add(Vector.create(e.clientX, e.clientY), Vector.fromPageOffset());
    };
    getParentRect = function(element) {
      var height, parent, rect, width;
      parent = PureDom.querySelectorParent(element, "svg");
      rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      return rect;
    };
    mouseConversion = function(instance, position, parentElement, width, height) {
      var diff, parentRect, x, xDiff, y, yDiff;
      parentRect = getParentRect(parentElement);
      xDiff = width / parentElement.getBoundingClientRect().width / instance.transform.scale;
      yDiff = height / parentElement.getBoundingClientRect().height / instance.transform.scale;
      diff = Math.max(xDiff, yDiff);
      x = position.x * diff;
      y = position.y * diff;
      return {
        x: x,
        y: y
      };
    };
    updateMousePos = function(e, mouse) {
      mouse.pos = vecFromEventGlobal(e);
      mouse.delta = Vector.subtract(mouse.pos, mouse.last);
      return mouse.last = mouse.pos;
    };
    return Make("Draggable", Draggable = function(instance, parent) {
      var scope;
      if (parent == null) {
        parent = null;
      }
      return scope = {
        mouse: null,
        dragging: false,
        setup: function() {
          var properties;
          if (parent != null) {
            properties = parent.getElement().getAttribute("viewBox").split(" ");
            scope.viewWidth = parseFloat(properties[2]);
            scope.viewHeight = parseFloat(properties[3]);
          }
          scope.mouse = {};
          scope.mouse.pos = {
            x: 0,
            y: 0
          };
          scope.mouse.delta = {
            x: 0,
            y: 0
          };
          scope.mouse.last = {
            x: 0,
            y: 0
          };
          PointerInput.addDown(instance.grabber.getElement(), scope.mouseDown);
          PointerInput.addMove(instance.getElement(), scope.mouseMove);
          if (parent != null) {
            PointerInput.addMove(parent.getElement(), scope.mouseMove);
          }
          PointerInput.addUp(instance.getElement(), scope.mouseUp);
          if (parent != null) {
            return PointerInput.addUp(parent.getElement(), scope.mouseUp);
          }
        },
        mouseDown: function(e) {
          updateMousePos(e, scope.mouse);
          if (e.button === 0) {
            return scope.dragging = true;
          }
        },
        mouseMove: function(e) {
          var newMouse;
          updateMousePos(e, scope.mouse);
          if (scope.dragging) {
            if (parent != null) {
              newMouse = mouseConversion(instance, scope.mouse.delta, parent.getElement(), scope.viewWidth, scope.viewHeight);
            } else {
              newMouse = {
                x: scope.mouse.x,
                y: scope.mouse.y
              };
            }
            instance.transform.x += newMouse.x;
            return instance.transform.y += newMouse.y;
          }
        },
        mouseUp: function(e) {
          return scope.dragging = false;
        }
      };
    });
  });

  Take(["Reaction", "SVG", "Symbol", "SymbolsReady"], function(Reaction, SVG, Symbol) {
    Symbol("HydraulicLine", [], function(svgElement) {
      var scope;
      return scope = {
        setup: function() {
          Reaction("Schematic:Hide", function() {
            return SVG.attr(svgElement, "filter", null);
          });
          return Reaction("Schematic:Show", function() {
            return SVG.attr(svgElement, "filter", "url(#allblackMatrix)");
          });
        }
      };
    });
    return SVG.createColorMatrixFilter("allblackMatrix", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0");
  });

  Take(["Ease", "PointerInput", "Vector"], function(Ease, PointerInput, Vector) {
    var joystick, knobMaxScale, knobMaxY, middleMaxY, stemMaxY, topMaxY;
    knobMaxY = -30.1;
    knobMaxScale = 0.84;
    stemMaxY = -7.1;
    topMaxY = -8;
    middleMaxY = -4;
    return Make("Joystick", joystick = function(svgElement) {
      var scope;
      return scope = {
        movement: 0.0,
        "default": 0.0,
        down: false,
        mousePos: {
          x: 0,
          y: 0
        },
        moved: false,
        callbacks: [],
        rangeMin: 0,
        rangeMax: 1,
        enabled: true,
        sticky: true,
        setup: function() {
          scope.setTransforms();
          PointerInput.addDown(svgElement, scope.mouseDown);
          PointerInput.addMove(svgElement, scope.mouseMove);
          PointerInput.addMove(scope.root.getElement(), scope.mouseMove);
          PointerInput.addUp(svgElement, scope.mouseUp);
          return PointerInput.addUp(scope.root.getElement(), scope.mouseUp);
        },
        schematicMode: function() {
          return scope.enabled = false;
        },
        animateMode: function() {
          return scope.enabled = true;
        },
        setDefault: function(pos) {
          scope["default"] = Ease.linear(pos, scope.rangeMin, scope.rangeMax, 0, 1, true);
          scope.movement = scope["default"];
          return scope.setTransforms();
        },
        setTransforms: function() {
          scope.knob.child5.transform.y = scope.movement * knobMaxY;
          scope.knob.child5.transform.scaleY = (1.0 - scope.movement) + scope.movement * knobMaxScale;
          scope.knob.child4.transform.y = scope.movement * stemMaxY;
          scope.knob.child3.transform.y = scope.movement * topMaxY;
          return scope.knob.child2.transform.y = scope.movement * middleMaxY;
        },
        setRange: function(rMin, rMax) {
          scope.rangeMin = rMin;
          return scope.rangeMax = rMax;
        },
        setSticky: function(sticky) {
          return scope.sticky = sticky;
        },
        mouseClick: function(e) {
          scope.movement = scope["default"];
          return scope.setTransforms();
        },
        mouseDown: function(e) {
          if (scope.enabled) {
            scope.down = true;
            return scope.mousePos = Vector.fromEventClient(e);
          }
        },
        mouseMove: function(e) {
          var callback, distance, len, m, newPos, ref, results;
          if (scope.down && scope.enabled) {
            scope.moved = true;
            newPos = Vector.fromEventClient(e);
            distance = (newPos.y - scope.mousePos.y) / 100;
            scope.mousePos = newPos;
            scope.movement -= distance;
            if (scope.movement > 1.0) {
              scope.movement = 1.0;
            } else if (scope.movement < 0.0) {
              scope.movement = 0.0;
            }
            scope.setTransforms();
            ref = scope.callbacks;
            results = [];
            for (m = 0, len = ref.length; m < len; m++) {
              callback = ref[m];
              results.push(callback(Ease.linear(scope.movement, 0, 1, scope.rangeMin, scope.rangeMax)));
            }
            return results;
          }
        },
        mouseUp: function() {
          var callback, len, m, ref;
          if (!scope.down) {
            return;
          }
          scope.down = false;
          if (!scope.moved || !scope.sticky) {
            scope.movement = scope["default"];
            scope.setTransforms();
            ref = scope.callbacks;
            for (m = 0, len = ref.length; m < len; m++) {
              callback = ref[m];
              callback(Ease.linear(scope.movement, 0, 1, scope.rangeMin, scope.rangeMax));
            }
          }
          return scope.moved = false;
        },
        setCallback: function(callback) {
          return scope.callbacks.push(callback);
        }
      };
    });
  });

  Take(["Ease", "PointerInput", "PureDom", "SVGTransform", "Vector", "DOMContentLoaded"], function(Ease, PointerInput, PureDom, SVGTransform, Vector) {
    var Slider, getParentRect, mouseConversion, updateMousePos, vecFromEventGlobal;
    vecFromEventGlobal = function(e) {
      return Vector.add(Vector.create(e.clientX, e.clientY), Vector.fromPageOffset());
    };
    getParentRect = function(element) {
      var height, parent, rect, width;
      parent = PureDom.querySelectorParent(element, "svg");
      rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      return rect;
    };
    mouseConversion = function(instance, position, parentElement, width, height) {
      var diff, parentRect, x, xDiff, y, yDiff;
      parentRect = getParentRect(parentElement);
      xDiff = width / parentElement.getBoundingClientRect().width / instance.transform.scale;
      yDiff = height / parentElement.getBoundingClientRect().height / instance.transform.scale;
      diff = Math.max(xDiff, yDiff);
      x = position.x * diff;
      y = position.y * diff;
      return {
        x: x,
        y: y
      };
    };
    updateMousePos = function(e, mouse) {
      mouse.pos = vecFromEventGlobal(e);
      mouse.delta = Vector.subtract(mouse.pos, mouse.last);
      return mouse.last = mouse.pos;
    };
    return Make("slider", Slider = function(svgElement) {
      var scope;
      return scope = {
        mouse: null,
        horizontalSlider: true,
        domainMin: 0,
        domainMax: 359,
        transformX: 0,
        transformY: 0,
        rangeMin: -1,
        rangeMax: 1,
        progress: 0,
        dragging: false,
        callback: function() {},
        setup: function() {
          var properties;
          scope.mouse = {};
          scope.mouse.pos = {
            x: 0,
            y: 0
          };
          scope.mouse.delta = {
            x: 0,
            y: 0
          };
          scope.mouse.last = {
            x: 0,
            y: 0
          };
          properties = scope.root.getElement().getAttribute("viewBox").split(" ");
          scope.viewWidth = parseFloat(properties[2]);
          scope.viewHeight = parseFloat(properties[3]);
          return PointerInput.addDown(svgElement, scope.mouseDown);
        },
        setVertical: function() {
          return scope.horizontalSlider = false;
        },
        setHorizontal: function() {
          return scope.horizontalSlider = true;
        },
        setCallback: function(callBackFunction) {
          return scope.callback = callBackFunction;
        },
        getValue: function() {
          return Ease.linear(scope.transform.angle, scope.domainMin, scope.domainMax, scope.rangeMin, scope.rangeMax);
        },
        setValue: function(input) {
          return scope.unmapped = Ease.linear(input, scope.domainMin, scope.domainMax, scope.rangeMin, scope.rangeMax);
        },
        setDomain: function(min, max) {
          scope.domainMin = min;
          return scope.domainMax = max;
        },
        setRange: function(min, max) {
          scope.rangeMin = min;
          return scope.rangeMax = max;
        },
        update: function() {
          if (typeof callback !== "undefined" && callback !== null) {
            return callback();
          }
        },
        mouseDown: function(e) {
          PointerInput.addMove(scope.root.getElement(), scope.mouseMove);
          PointerInput.addUp(scope.root.getElement(), scope.mouseUp);
          PointerInput.addUp(window, scope.mouseUp);
          scope.dragging = true;
          return updateMousePos(e, scope.mouse);
        },
        mouseMove: function(e) {
          var callbackValue, newMouse;
          updateMousePos(e, scope.mouse);
          if (scope.dragging) {
            if (typeof parent !== "undefined" && parent !== null) {
              newMouse = mouseConversion(scope, scope.mouse.delta, scope.root.getElement(), scope.viewWidth, scope.viewHeight);
            } else {
              newMouse = {
                x: scope.mouse.pos.x,
                y: scope.mouse.y
              };
            }
            callbackValue = 0;
            if (scope.horizontalSlider) {
              scope.transformX += newMouse.x;
              scope.transform.x = scope.transformX;
              if (scope.transform.x < scope.domainMin) {
                scope.transform.x = scope.domainMin;
              }
              if (scope.transform.x > scope.domainMax) {
                scope.transform.x = scope.domainMax;
              }
              callbackValue = Ease.linear(scope.transform.x, scope.domainMin, scope.domainMax, scope.rangeMin, scope.rangeMax);
            } else {
              scope.transformY += newMouse.y;
              scope.transform.y = scope.transformY;
              if (scope.transform.y < scope.domainMin) {
                scope.transform.y = scope.domainMin;
              }
              if (scope.transform.y > scope.domainMax) {
                scope.transform.y = scope.domainMax;
              }
              callbackValue = Ease.linear(scope.transform.y, scope.domainMin, scope.domainMax, scope.rangeMin, scope.rangeMax);
            }
            return scope.callback(callbackValue);
          }
        },
        mouseUp: function(e) {
          scope.dragging = true;
          PointerInput.removeMove(scope.root.getElement(), scope.mouseMove);
          PointerInput.removeUp(scope.root.getElement(), scope.mouseUp);
          return PointerInput.removeUp(window, scope.mouseUp);
        }
      };
    });
  });

  Take(["PointerInput", "Resize", "SVG", "TRS"], function(PointerInput, Resize, SVG, TRS) {
    var ControlPanel, bg, construct, controlPanel, elements, resize, topbarHeight;
    topbarHeight = 48;
    elements = [];
    controlPanel = TRS(SVG.create("g", SVG.root, {
      "class": "ControlPanel"
    }));
    bg = SVG.create("rect", controlPanel, {
      "class": "BG"
    });
    Resize(resize = function() {
      var panelWidth;
      panelWidth = Math.ceil(5 * Math.sqrt(window.innerWidth));
      SVG.attr(bg, "width", panelWidth);
      SVG.attr(bg, "height", window.innerHeight - topbarHeight);
      return TRS.move(controlPanel, window.innerWidth - panelWidth, topbarHeight);
    });
    construct = function(name, fn) {
      var i;
      return i = elements.length;
    };
    return Make("ControlPanel", ControlPanel = {
      addControl: function(name, cb) {
        return Take(name, function(fn) {
          return construct(name, fn);
        });
      }
    });
  });

  Take(["PointerInput", "Resize", "SVG", "TRS"], function(PointerInput, Resize, SVG, TRS) {
    var TopBar, bg, buttonPad, construct, container, elements, iconPad, offsetX, resize, topBar, topBarHeight;
    topBarHeight = 48;
    buttonPad = 30;
    iconPad = 4;
    elements = {};
    offsetX = 0;
    topBar = SVG.create("g", SVG.root, {
      "class": "TopBar"
    });
    bg = SVG.create("rect", topBar, {
      height: 48,
      fill: "url(#TopBarGradient)"
    });
    SVG.createGradient("TopBarGradient", false, "#35488d", "#5175bd", "#35488d");
    container = TRS(SVG.create("g", topBar, {
      "class": "Elements"
    }));
    resize = function() {
      var base, elm, len, m, results;
      console.log("RESIZE");
      console.log(window.innerWidth);
      SVG.attrs(bg, {
        width: window.innerWidth
      });
      TRS.move(container, window.innerWidth / 2 - offsetX / 2);
      results = [];
      for (m = 0, len = elements.length; m < len; m++) {
        elm = elements[m];
        results.push(typeof (base = elm.scope).resize === "function" ? base.resize() : void 0);
      }
      return results;
    };
    construct = function(i, name, scope) {
      var buttonWidth, iconRect, iconScale, iconX, iconY, textRect, textX;
      name = name.replace("TB:", "");
      scope.element = TRS(SVG.create("g", container, {
        "class": "ui Element"
      }));
      elements[name] = {
        element: scope.element,
        i: i,
        name: name,
        scope: scope
      };
      if (scope.bg == null) {
        scope.bg = SVG.create("rect", scope.element, {
          "class": "BG",
          height: topBarHeight
        });
      }
      if (scope.icon == null) {
        scope.icon = TRS(SVG.clone(document.getElementById(name.toLowerCase()), scope.element));
      }
      if (scope.text == null) {
        scope.text = TRS(SVG.create("text", scope.element, {
          "font-family": "Lato",
          "font-size": 14,
          fill: "#FFF",
          textContent: name.toUpperCase()
        }));
      }
      iconRect = scope.icon.getBoundingClientRect();
      textRect = scope.text.getBoundingClientRect();
      iconScale = Math.min((topBarHeight - iconPad * 2) / iconRect.width, (topBarHeight - iconPad * 2) / iconRect.height);
      iconX = buttonPad;
      iconY = topBarHeight / 2 - iconRect.height * iconScale / 2;
      textX = buttonPad + iconRect.width * iconScale + iconPad;
      buttonWidth = textX + textRect.width + buttonPad;
      TRS.abs(scope.icon, {
        x: iconX,
        y: iconY,
        scale: iconScale
      });
      TRS.move(scope.text, textX, topBarHeight / 2 + textRect.height / 2 - 3);
      SVG.attrs(scope.bg, {
        width: buttonWidth
      });
      TRS.move(scope.element, offsetX);
      offsetX += buttonWidth;
      if (typeof scope.setup === "function") {
        scope.setup(scope.element);
      }
      if (scope.resize != null) {
        Resize(scope.resize);
      }
      if (scope.click != null) {
        return PointerInput.addClick(scope.element, scope.click);
      }
    };
    return Make("TopBar", TopBar = {
      init: function() {
        var elementNames;
        elementNames = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        Take(elementNames, function() {
          var elementScopes, i, len, m, scope;
          elementScopes = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          for (i = m = 0, len = elementScopes.length; m < len; i = ++m) {
            scope = elementScopes[i];
            construct(i, elementNames[i], scope);
          }
          return Resize(resize);
        });
        return TopBar.init = function() {
          throw "TopBar.init was called more than once.";
        };
      }
    });
  });

  Take(["Action", "FlowArrows", "SVGStyle", "SVGTransform", "SVG", "Symbol", "DOMContentLoaded"], function(Action, FlowArrows, SVGStyle, SVGTransform, SVG, Symbol) {
    var addClass, getSymbol, makeScope, makeScopeTree;
    makeScope = function(instanceName, element, parentScope) {
      var instance, symbol;
      symbol = getSymbol(instanceName);
      console.log(Object.assign({}, Take()));
      addClass(element, symbol.name);
      instance = symbol.create(element);
      if (instance.children == null) {
        instance.children = [];
      }
      instance.element = element;
      if (instance.getElement == null) {
        instance.getElement = function() {
          return element;
        };
      }
      if (instance.root == null) {
        instance.root = (parentScope != null ? parentScope.root : void 0) || instance;
      }
      if (instance.style == null) {
        instance.style = SVGStyle(element);
      }
      if (instance.transform == null) {
        instance.transform = SVGTransform(element);
      }
      if (parentScope != null) {
        if (instanceName !== "DefaultElement") {
          parentScope[instanceName] = instance;
        }
        parentScope.children.push(instance);
      }
      return instance;
    };
    makeScopeTree = function(parentScope, parentElement) {
      var childElement, childName, childScope, len, m, ref, ref1, results;
      ref = parentElement.childNodes;
      results = [];
      for (m = 0, len = ref.length; m < len; m++) {
        childElement = ref[m];
        if (childElement instanceof SVGGElement) {
          if (childElement._SVG == null) {
            childName = (ref1 = childElement.getAttribute("id")) != null ? ref1.split("_")[0] : void 0;
            childScope = makeScope(childName, childElement, parentScope);
            results.push(makeScopeTree(childScope, childElement));
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
    getSymbol = function(instanceName) {
      var symbol;
      symbol = Symbol.forInstanceName(instanceName);
      if (symbol != null) {
        return symbol;
      } else if ((instanceName != null ? instanceName.indexOf("Line") : void 0) > -1) {
        return Symbol.forSymbolName("HydraulicLine");
      } else {
        return Symbol.forSymbolName("DefaultElement");
      }
    };
    addClass = function(element, newClass) {
      var className;
      className = element.getAttribute("class");
      return SVG.attr(element, "class", className != null ? className + " " + newClass : newClass);
    };
    return Take("SymbolsReady", function() {
      return setTimeout(function() {
        var root, svg;
        svg = document.rootElement;
        root = makeScope("root", svg);
        root.FlowArrows = FlowArrows();
        Make("root", root);
        makeScopeTree(root, svg);
        Action("setup");
        return setTimeout(function() {
          Action("Schematic:Show");
          return setTimeout(function() {
            return svg.style.opacity = 1;
          });
        });
      });
    });
  });

  Take("RequestUniqueAnimation", function(RequestUniqueAnimation) {
    var SVGAnimation;
    return Make("SVGAnimation", SVGAnimation = function(callback) {
      var scope;
      return scope = {
        running: false,
        restart: false,
        time: 0,
        startTime: 0,
        dT: 0,
        runAnimation: function(currTime) {
          var dT, newTime;
          if (!scope.running) {
            return;
          }
          if (scope.restart) {
            scope.startTime = currTime;
            scope.time = 0;
            scope.restart = false;
          } else {
            newTime = currTime - scope.startTime;
            dT = (newTime - scope.time) / 1000;
            scope.time = newTime;
            callback(dT, scope.time);
          }
          if (scope.running) {
            return RequestUniqueAnimation(scope.runAnimation);
          }
        },
        start: function() {
          var startAnimation;
          if (scope.running) {
            scope.restart = true;
            return;
          }
          scope.running = true;
          startAnimation = function(currTime) {
            scope.startTime = currTime;
            scope.time = 0;
            return RequestUniqueAnimation(scope.runAnimation);
          };
          return RequestUniqueAnimation(startAnimation);
        },
        stop: function() {
          return scope.running = false;
        }
      };
    });
  });

  Take("SVG", function(SVG) {
    var Highlighter, enabled;
    enabled = true;
    Make("Highlighter", Highlighter = {
      setup: function(highlighted) {
        var highlight, len, m, mouseLeave, mouseOver, results;
        if (highlighted == null) {
          highlighted = [];
        }
        mouseOver = function(e) {
          var highlight, len, m, results;
          if (enabled) {
            results = [];
            for (m = 0, len = highlighted.length; m < len; m++) {
              highlight = highlighted[m];
              results.push(SVG.attr(highlight, "filter", "url(#highlightMatrix)"));
            }
            return results;
          }
        };
        mouseLeave = function(e) {
          var highlight, len, m, results;
          results = [];
          for (m = 0, len = highlighted.length; m < len; m++) {
            highlight = highlighted[m];
            results.push(SVG.attr(highlight, "filter", null));
          }
          return results;
        };
        results = [];
        for (m = 0, len = highlighted.length; m < len; m++) {
          highlight = highlighted[m];
          highlight.addEventListener("mouseover", mouseOver);
          results.push(highlight.addEventListener("mouseleave", mouseLeave));
        }
        return results;
      },
      enable: function() {
        return enabled = true;
      },
      disable: function() {
        return enabled = true;
      }
    });
    return SVG.createColorMatrixFilter("highlightMatrix", ".5  0   0    0   0 .5  1   .5   0  20 0   0   .5   0   0 0   0   0    1   0");
  });

  getParentInverseTransform = function(root, element, currentTransform) {
    var inv, inversion, matches, matrixString, newMatrix;
    if (element.nodeName === "svg" || element.getAttribute("id") === "mainStage") {
      return currentTransform;
    }
    newMatrix = root.getElement().createSVGMatrix();
    matrixString = element.getAttribute("transform");
    matches = matrixString.match(/[+-]?\d+(\.\d+)?/g);
    newMatrix.a = matches[0];
    newMatrix.b = matches[1];
    newMatrix.c = matches[2];
    newMatrix.d = matches[3];
    newMatrix.e = matches[4];
    newMatrix.f = matches[5];
    inv = newMatrix.inverse();
    inversion = "matrix(" + inv.a + ", " + inv.b + ", " + inv.c + ", " + inv.d + ", " + inv.e + ", " + inv.f + ")";
    currentTransform = currentTransform + " " + inversion;
    return getParentInverseTransform(root, element.parentNode, currentTransform);
  };

  Make("SVGMask", SVGMask = function(root, maskInstance, maskedInstance, maskName) {
    var invertMatrix, mask, maskElement, maskedElement, maskedParent, newStyle, origMatrix, origStyle, rootElement, transString;
    maskElement = maskInstance.getElement();
    maskedElement = maskedInstance.getElement();
    rootElement = root.getElement();
    mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    mask.setAttribute("id", maskName);
    mask.setAttribute("maskContentUnits", "userSpaceOnUse");
    maskedParent = document.createElementNS("http://www.w3.org/2000/svg", "g");
    maskedParent.setAttribute('transform', maskedElement.getAttribute('transform'));
    maskedElement.parentNode.insertBefore(maskedParent, maskedElement);
    maskedElement.parentNode.removeChild(maskedElement);
    maskedParent.appendChild(maskedElement);
    mask.appendChild(maskElement);
    rootElement.querySelector('defs').insertBefore(mask, null);
    invertMatrix = getParentInverseTransform(root, maskedElement.parentNode, "");
    origMatrix = maskElement.getAttribute("transform");
    transString = invertMatrix + " " + origMatrix + " ";
    maskElement.setAttribute('transform', transString);
    origStyle = maskedElement.getAttribute('style');
    if (origStyle != null) {
      newStyle = origStyle + ("; mask: url(#" + maskName + ");");
    } else {
      newStyle = "mask: url(#" + maskName + ");";
    }
    maskedElement.setAttribute('transform', "matrix(1, 0, 0, 1, 0, 0)");
    maskedInstance.transform.setBaseTransform();
    return maskedParent.setAttribute("style", newStyle);
  });

  Take(["PureDom", "HydraulicPressure", "Global"], function(PureDom, HydraulicPressure, Global) {
    var SVGStyle;
    return Make("SVGStyle", SVGStyle = function(svgElement) {
      var ref, scope, styleCache;
      styleCache = {};
      return scope = {
        isLine: ((ref = svgElement.getAttribute("id")) != null ? ref.indexOf("Line") : void 0) > -1,
        pressure: 0,
        visible: function(isVisible) {
          if (isVisible) {
            return svgElement.style.opacity = 1.0;
          } else {
            return svgElement.style.opacity = 0.0;
          }
        },
        show: function(showElement) {
          if (showElement) {
            return svgElement.style.visibility = "visible";
          } else {
            return svgElement.style.visibility = "hidden";
          }
        },
        setPressure: function(val, alpha) {
          if (alpha == null) {
            alpha = 1.0;
          }
          scope.pressure = val;
          if (scope.isLine && Global.enableHydraulicLines) {
            return scope.stroke(HydraulicPressure(scope.pressure, alpha));
          } else {
            return scope.fill(HydraulicPressure(scope.pressure, alpha));
          }
        },
        getPressure: function() {
          return scope.pressure;
        },
        getPressureColor: function(pressure) {
          return HydraulicPressure(pressure);
        },
        stroke: function(color) {
          var clone, defs, link, parent, path, use, useParent;
          path = svgElement.querySelector("path");
          use = svgElement.querySelector("use");
          if ((path == null) && (use != null)) {
            useParent = PureDom.querySelectorParent(use, "g");
            parent = PureDom.querySelectorParent(svgElement, "svg");
            defs = parent.querySelector("defs");
            link = defs.querySelector(use.getAttribute("xlink:href"));
            clone = link.cloneNode(true);
            useParent.appendChild(clone);
            useParent.removeChild(use);
          }
          path = svgElement.querySelector("path");
          if (path != null) {
            return path.setAttributeNS(null, "stroke", color);
          }
        },
        fill: function(color) {
          var clone, defs, link, parent, path, use, useParent;
          path = svgElement.querySelector("path");
          use = svgElement.querySelector("use");
          if ((path == null) && (use != null)) {
            useParent = PureDom.querySelectorParent(use, "g");
            parent = PureDom.querySelectorParent(svgElement, "svg");
            defs = parent.querySelector("defs");
            link = defs.querySelector(use.getAttribute("xlink:href"));
            clone = link.cloneNode(true);
            useParent.appendChild(clone);
            useParent.removeChild(use);
          }
          path = svgElement.querySelector("path");
          if (path != null) {
            return path.setAttributeNS(null, "fill", color);
          }
        },
        linearGradient: function(stops, x1, y1, x2, y2) {
          var fillUrl, gradient, gradientName, gradientStop, len, m, stop, useParent;
          if (x1 == null) {
            x1 = 0;
          }
          if (y1 == null) {
            y1 = 0;
          }
          if (x2 == null) {
            x2 = 1;
          }
          if (y2 == null) {
            y2 = 0;
          }
          useParent = PureDom.querySelectorParent(svgElement, "svg");
          gradientName = "Gradient_" + svgElement.getAttributeNS(null, "id");
          gradient = useParent.querySelector("defs").querySelector("#" + gradientName);
          if (gradient == null) {
            gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
            useParent.querySelector("defs").appendChild(gradient);
          }
          gradient.setAttribute("id", gradientName);
          gradient.setAttributeNS(null, "x1", x1);
          gradient.setAttributeNS(null, "y1", y1);
          gradient.setAttributeNS(null, "x2", x2);
          gradient.setAttributeNS(null, "y2", y2);
          while (gradient.hasChildNodes()) {
            gradient.removeChild(gradient.firstChild);
          }
          for (m = 0, len = stops.length; m < len; m++) {
            stop = stops[m];
            gradientStop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
            gradientStop.setAttribute("offset", stop.offset);
            gradientStop.setAttribute("stop-color", stop.color);
            gradient.appendChild(gradientStop);
          }
          fillUrl = "url(#" + gradientName + ")";
          return scope.fill(fillUrl);
        },
        radialGradient: function(stops, cx, cy, radius) {
          var fillUrl, gradient, gradientName, gradientStop, len, m, stop, useParent;
          useParent = PureDom.querySelectorParent(svgElement, "svg");
          gradientName = "Gradient_" + svgElement.getAttributeNS(null, "id");
          gradient = useParent.querySelector("defs").querySelector("#" + gradientName);
          if (gradient == null) {
            gradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
            useParent.querySelector("defs").appendChild(gradient);
          }
          gradient.setAttribute("id", gradientName);
          if (cx != null) {
            gradient.setAttributeNS(null, "cx", cx);
          }
          if (cy != null) {
            gradient.setAttributeNS(null, "cy", cy);
          }
          if (radius != null) {
            gradient.setAttributeNS(null, "r", radius);
          }
          while (gradient.hasChildNodes()) {
            gradient.removeChild(gradient.firstChild);
          }
          for (m = 0, len = stops.length; m < len; m++) {
            stop = stops[m];
            gradientStop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
            gradientStop.setAttribute("offset", stop.offset);
            gradientStop.setAttribute("stop-color", stop.color);
            gradient.appendChild(gradientStop);
          }
          fillUrl = "url(#" + gradientName + ")";
          return scope.fill(fillUrl);
        },
        setText: function(text) {
          var textElement;
          textElement = svgElement.querySelector("text").querySelector("tspan");
          if (textElement != null) {
            return textElement.textContent = text;
          }
        },
        setProperty: function(key, val) {
          if (styleCache[key] !== val) {
            styleCache[key] = val;
            return svgElement.style[key] = val;
          }
        },
        getElement: function() {
          return svgElement;
        }
      };
    });
  });

  Take("RequestDeferredRender", function(RequestDeferredRender) {
    var SVGTransform;
    return Make("SVGTransform", SVGTransform = function(svgElement) {
      var angleVal, applyTransform, baseTransform, currentTransformString, cxVal, cyVal, newTransformString, rotate, rotationString, scaleString, scaleVal, scaleXVal, scaleYVal, scaling, scope, setTransform, translate, translateString, xVal, yVal;
      baseTransform = svgElement.getAttribute("transform");
      currentTransformString = null;
      newTransformString = null;
      translateString = "";
      rotationString = "";
      scaleString = "";
      xVal = 0;
      yVal = 0;
      cxVal = 0;
      cyVal = 0;
      angleVal = 0;
      scaleVal = 1;
      scaleXVal = 1;
      scaleYVal = 1;
      scope = {};
      scope.setBaseIdentity = function() {
        return baseTransform = "matrix(1,0,0,1,0,0)";
      };
      scope.setBaseTransform = function() {
        return baseTransform = svgElement.getAttribute("transform");
      };
      rotate = function(angle, cx, cy) {
        rotationString = "rotate(" + angle + ", " + cx + ", " + cy + ")";
        return setTransform();
      };
      translate = function(x, y) {
        translateString = "translate(" + x + ", " + y + ")";
        return setTransform();
      };
      scaling = function(scaleX, scaleY) {
        if (scaleY == null) {
          scaleY = scaleX;
        }
        scaleString = "scale(" + scaleX + ", " + scaleY + ")";
        return setTransform();
      };
      setTransform = function() {
        newTransformString = baseTransform + " " + rotationString + " " + scaleString + " " + translateString;
        return RequestDeferredRender(applyTransform, true);
      };
      applyTransform = function() {
        if (currentTransformString === newTransformString) {
          return;
        }
        currentTransformString = newTransformString;
        return svgElement.setAttribute("transform", currentTransformString);
      };
      Object.defineProperty(scope, 'x', {
        get: function() {
          return xVal;
        },
        set: function(val) {
          return translate(xVal = val, yVal);
        }
      });
      Object.defineProperty(scope, 'y', {
        get: function() {
          return yVal;
        },
        set: function(val) {
          return translate(xVal, yVal = val);
        }
      });
      Object.defineProperty(scope, 'cx', {
        get: function() {
          return cxVal;
        },
        set: function(val) {
          return rotate(angleVal, cxVal = val, cyVal);
        }
      });
      Object.defineProperty(scope, 'cy', {
        get: function() {
          return cyVal;
        },
        set: function(val) {
          return rotate(angleVal, cxVal, cyVal = val);
        }
      });
      Object.defineProperty(scope, 'angle', {
        get: function() {
          return angleVal;
        },
        set: function(val) {
          return rotate(angleVal = val, cxVal, cyVal);
        }
      });
      Object.defineProperty(scope, 'turns', {
        get: function() {
          return scope.angle / 360;
        },
        set: function(val) {
          return scope.angle = val * 360;
        }
      });
      Object.defineProperty(scope, 'scale', {
        get: function() {
          return scaleVal;
        },
        set: function(val) {
          return scaling(scaleVal = val);
        }
      });
      Object.defineProperty(scope, 'scaleX', {
        get: function() {
          return scaleXVal;
        },
        set: function(val) {
          return scaling(scaleXVal = val, scaleYVal);
        }
      });
      Object.defineProperty(scope, 'scaleY', {
        get: function() {
          return scaleYVal;
        },
        set: function(val) {
          return scaling(scaleXVal, scaleYVal = val);
        }
      });
      return scope;
    });
  });

  Take([], function() {
    var cbs;
    cbs = [];
    Make("Reaction", function(name, cb) {
      return (cbs[name] != null ? cbs[name] : cbs[name] = []).push(cb);
    });
    return Make("Action", function() {
      var args, cb, len, m, name, ref, results;
      name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (cbs[name] != null) {
        ref = cbs[name];
        results = [];
        for (m = 0, len = ref.length; m < len; m++) {
          cb = ref[m];
          results.push(cb.apply(null, args));
        }
        return results;
      }
    });
  });

  Take([], function() {
    var dispatchFn, dispatchString;
    Make("Dispatch", function(node, fn, sub) {
      if (sub == null) {
        sub = "children";
      }
      if (typeof fn === "string") {
        return dispatchString(node, fn, sub);
      } else {
        return dispatchFn(node, fn, sub);
      }
    });
    dispatchString = function(node, fn, sub) {
      var child, len, m, ref, results;
      if (typeof node[fn] === "function") {
        node[fn]();
      }
      ref = node[sub];
      results = [];
      for (m = 0, len = ref.length; m < len; m++) {
        child = ref[m];
        results.push(dispatchString(child, fn, sub));
      }
      return results;
    };
    return dispatchFn = function(node, fn, sub) {
      var child, len, m, ref, results;
      fn(node);
      ref = node[sub];
      results = [];
      for (m = 0, len = ref.length; m < len; m++) {
        child = ref[m];
        results.push(dispatchFn(child, fn, sub));
      }
      return results;
    };
  });

  Take([], function() {
    var Global, internal, readWrite;
    Make("Global", Global = {});
    internal = {};
    readWrite = function(name, initial) {
      internal[name] = initial;
      return Object.defineProperty(Global, name, {
        get: function() {
          return internal[name];
        },
        set: function(val) {
          return internal[name] = val;
        }
      });
    };
    readWrite("animateMode", false);
    Object.defineProperty(Global, "schematicMode", {
      get: function() {
        return !internal.animateMode;
      },
      set: function(val) {
        return internal.animateMode = !val;
      }
    });
    return readWrite("enableHydraulicLines");
  });

  (function() {
    var deferredCallbacks, rafCallbacks, requested, run;
    requested = false;
    rafCallbacks = [];
    deferredCallbacks = [];
    run = function(t) {
      var _cbs, cb, len, len1, m, n, results;
      requested = false;
      _cbs = rafCallbacks;
      rafCallbacks = [];
      for (m = 0, len = _cbs.length; m < len; m++) {
        cb = _cbs[m];
        cb(t);
      }
      _cbs = deferredCallbacks;
      deferredCallbacks = [];
      results = [];
      for (n = 0, len1 = _cbs.length; n < len1; n++) {
        cb = _cbs[n];
        results.push(cb());
      }
      return results;
    };
    Make("RequestDeferredRender", function(cb, ignoreDuplicates) {
      var c, len, m;
      if (ignoreDuplicates == null) {
        ignoreDuplicates = false;
      }
      if (cb == null) {
        return console.log("Warning: RequestDeferredRender(null)");
      }
      for (m = 0, len = deferredCallbacks.length; m < len; m++) {
        c = deferredCallbacks[m];
        if (!(c === cb)) {
          continue;
        }
        if (ignoreDuplicates) {
          return;
        }
        this.RDRDuplicate = cb;
        return console.log("Warning: RequestDeferredRender was called with the same function more than once. To figure out which function, please run `RDRDuplicate` in the browser console.");
      }
      deferredCallbacks.push(cb);
      if (!requested) {
        requested = true;
        return requestAnimationFrame(run);
      }
    });
    return Make("RequestUniqueAnimation", function(cb, ignoreDuplicates) {
      var c, len, m;
      if (ignoreDuplicates == null) {
        ignoreDuplicates = false;
      }
      if (cb == null) {
        return console.log("Warning: RequestUniqueAnimation(null)");
      }
      for (m = 0, len = rafCallbacks.length; m < len; m++) {
        c = rafCallbacks[m];
        if (!(c === cb)) {
          continue;
        }
        if (ignoreDuplicates) {
          return;
        }
        this.RUADuplicate = cb;
        return console.log("Warning: RequestUniqueAnimation was called with the same function more than once.  To figure out which function, please run `RUADuplicate` in the browser console.");
      }
      rafCallbacks.push(cb);
      if (!requested) {
        requested = true;
        return requestAnimationFrame(run);
      }
    });
  })();

  Take(["RequestUniqueAnimation"], function(RequestUniqueAnimation) {
    return Make("Resize", function(cb) {
      var r;
      (r = function() {
        return RequestUniqueAnimation(cb, true);
      })();
      return window.addEventListener("resize", r);
    });
  });

  Take(["DOMContentLoaded"], function() {
    var SVG, createStops, defs, namespaces, props, root;
    namespaces = {
      svg: "http://www.w3.org/2000/svg",
      "xlink:href": "http://www.w3.org/1999/xlink"
    };
    props = {
      textContent: true
    };
    root = document.querySelector("svg");
    defs = root.querySelector("defs");
    Make("SVG", SVG = {
      root: root,
      defs: defs,
      move: function(elm, x, y) {
        if (y == null) {
          y = 0;
        }
        throw "MOVE";
      },
      rotate: function(elm, r) {
        throw "ROTATE";
      },
      origin: function(elm, ox, oy) {
        throw "ORIGIN";
      },
      scale: function(elm, x, y) {
        if (y == null) {
          y = x;
        }
        throw "SCALE";
      },
      create: function(type, parent, attrs) {
        var elm;
        elm = document.createElementNS(namespaces.svg, type);
        SVG.attrs(elm, attrs);
        if (parent != null) {
          SVG.append(parent, elm);
        }
        return elm;
      },
      clone: function(source, parent, attrs) {
        var attr, child, elm, len, len1, m, n, ref, ref1;
        elm = document.createElementNS(namespaces.svg, "g");
        ref = source.attributes;
        for (m = 0, len = ref.length; m < len; m++) {
          attr = ref[m];
          SVG.attr(elm, attr.name, attr.value);
        }
        SVG.attrs(elm, {
          id: null
        });
        SVG.attrs(elm, attrs);
        ref1 = source.childNodes;
        for (n = 0, len1 = ref1.length; n < len1; n++) {
          child = ref1[n];
          SVG.append(elm, child.cloneNode(true));
        }
        if (parent != null) {
          SVG.append(parent, elm);
        }
        return elm;
      },
      append: function(parent, child) {
        parent.appendChild(child);
        return child;
      },
      prepend: function(parent, child) {
        if (parent.hasChildNodes()) {
          parent.insertBefore(child, parent.firstChild);
        } else {
          parent.appendChild(child);
        }
        return child;
      },
      attrs: function(elm, attrs) {
        var k, v;
        for (k in attrs) {
          v = attrs[k];
          SVG.attr(elm, k, v);
        }
        return elm;
      },
      attr: function(elm, k, v) {
        if (v === void 0) {
          return elm.getAttribute(k);
        }
        if (elm._SVG == null) {
          elm._SVG = {};
        }
        if (elm._SVG[k] !== v) {
          elm._SVG[k] = v;
          if (props[k] != null) {
            elm[k] = v;
          } else if (v != null) {
            elm.setAttributeNS(namespaces[k] || null, k, v);
          } else {
            elm.removeAttributeNS(namespaces[k] || null, k);
          }
        }
        return v;
      },
      grey: function(elm, l) {
        SVG.attr(elm, "fill", "hsl(0, 0%, " + (l * 100) + "%)");
        return elm;
      },
      hsl: function(elm, h, s, l) {
        SVG.attr(elm, "fill", "hsl(" + (h * 360) + ", " + (s * 100) + "%, " + (l * 100) + "%)");
        return elm;
      },
      createGradient: function() {
        var attrs, gradient, name, stops, vertical;
        name = arguments[0], vertical = arguments[1], stops = 3 <= arguments.length ? slice.call(arguments, 2) : [];
        attrs = vertical ? {
          id: name,
          x2: 0,
          y2: 1
        } : {
          id: name
        };
        gradient = SVG.create("linearGradient", defs, attrs);
        createStops(gradient, stops);
        return gradient;
      },
      createRadialGradient: function() {
        var gradient, name, stops;
        name = arguments[0], stops = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        gradient = SVG.create("radialGradient", defs, {
          id: name
        });
        createStops(gradient, stops);
        return gradient;
      },
      createColorMatrixFilter: function(name, values) {
        var filter;
        filter = SVG.create("filter", defs, {
          id: name
        });
        SVG.create("feColorMatrix", filter, {
          "in": "SourceGraphic",
          type: "matrix",
          values: values
        });
        return filter;
      }
    });
    return createStops = function(gradient, stops) {
      var attrs, i, len, m, stop;
      stops = stops[0] instanceof Array ? stops[0] : stops;
      for (i = m = 0, len = stops.length; m < len; i = ++m) {
        stop = stops[i];
        attrs = typeof stop === "string" ? {
          "stop-color": stop,
          offset: (100 * i / (stops.length - 1)) + "%"
        } : {
          "stop-color": stop.color,
          offset: (100 * stop.offset) + "%"
        };
        SVG.create("stop", gradient, attrs);
      }
      return null;
    };
  });

  Take([], function() {
    var Symbol, byInstanceName, bySymbolName, first;
    bySymbolName = {};
    byInstanceName = {};
    first = true;
    Symbol = function(symbolName, instanceNames, symbolFn) {
      var instanceName, len, m, results, symbol;
      console.log("MAKE " + symbolName);
      if (first) {
        Make("SymbolsReady");
      }
      first = false;
      if (bySymbolName[symbolName] != null) {
        throw "The symbol \"" + symbolName + "\" is defined more than once. You'll need to change one of the definitions to use a more unique name.";
      }
      symbol = {
        create: symbolFn,
        name: symbolName
      };
      bySymbolName[symbolName] = symbol;
      results = [];
      for (m = 0, len = instanceNames.length; m < len; m++) {
        instanceName = instanceNames[m];
        if (byInstanceName[instanceName] != null) {
          throw "The instance \"" + instanceName + "\" is defined more than once, by Symbol \"" + byInstanceName[instanceName].symbolName + "\" and Symbol \"" + symbolName + "\". You'll need to change one of these instances to use a more unique name. You might need to change your FLA. This is a shortcoming of SVGA — sorry!";
        }
        results.push(byInstanceName[instanceName] = symbol);
      }
      return results;
    };
    Symbol.forSymbolName = function(symbolName) {
      return bySymbolName[symbolName];
    };
    Symbol.forInstanceName = function(instanceName) {
      return byInstanceName[instanceName];
    };
    return Make("Symbol", Symbol);
  });

  Take(["RequestDeferredRender", "SVG"], function(RequestDeferredRender, SVG) {
    var TRS, err, setup;
    err = function(elm, message) {
      console.log(elm);
      throw "^ " + message;
    };
    setup = function(wrapper, elm) {
      var v;
      return elm._trs = v = {
        x: 0,
        y: 0,
        r: 0,
        sx: 1,
        sy: 1,
        ox: 0,
        oy: 0,
        apply: function() {
          SVG.attr(wrapper, "transform", "translate(" + v.x + "," + v.y + ") rotate(" + (v.r * 360) + ") scale(" + v.sx + "," + v.sy + ")");
          return SVG.attr(elm, "transform", "translate(" + (-v.ox) + "," + (-v.oy) + ")");
        }
      };
    };
    TRS = function(elm) {
      var wrapper;
      if (elm == null) {
        err(elm, "Null element passed to TRS(elm)");
      }
      if (elm.parentNode == null) {
        err(elm, "Element passed to TRS(elm) must have a parentNode");
      }
      wrapper = SVG.create("g", elm.parentNode, {
        "class": "TRS"
      });
      setup(wrapper, elm);
      SVG.append(wrapper, elm);
      return elm;
    };
    TRS.abs = function(elm, attrs) {
      var delta;
      if ((elm != null ? elm._trs : void 0) == null) {
        err(elm, "Non-TRS element passed to TRS.abs(elm, attrs)");
      }
      if (attrs == null) {
        err(elm, "Null attrs passed to TRS.abs(elm, attrs)");
      }
      if (attrs.scale != null) {
        attrs.sx = attrs.sy = attrs.scale;
      }
      if (attrs.x != null) {
        elm._trs.x = attrs.x;
      }
      if (attrs.y != null) {
        elm._trs.y = attrs.y;
      }
      if (attrs.r != null) {
        elm._trs.r = attrs.r;
      }
      if (attrs.sx != null) {
        elm._trs.sx = attrs.sx;
      }
      if (attrs.sy != null) {
        elm._trs.sy = attrs.sy;
      }
      if (attrs.ox != null) {
        delta = attrs.ox - elm._trs.ox;
        elm._trs.ox = attrs.ox;
        elm._trs.x += delta;
      }
      if (attrs.oy != null) {
        delta = attrs.oy - elm._trs.oy;
        elm._trs.oy = attrs.oy;
        elm._trs.y += delta;
      }
      RequestDeferredRender(elm._trs.apply, true);
      return elm;
    };
    TRS.rel = function(elm, attrs) {
      if ((elm != null ? elm._trs : void 0) == null) {
        err(elm, "Non-TRS element passed to TRS.abs(elm, attrs)");
      }
      if (attrs == null) {
        err(elm, "Null attrs passed to TRS.abs(elm, attrs)");
      }
      if (attrs.x != null) {
        elm._trs.x += attrs.x;
      }
      if (attrs.y != null) {
        elm._trs.y += attrs.y;
      }
      if (attrs.r != null) {
        elm._trs.r += attrs.r;
      }
      if (attrs.sx != null) {
        elm._trs.sx += attrs.sx;
      }
      if (attrs.sy != null) {
        elm._trs.sy += attrs.sy;
      }
      if (attrs.ox != null) {
        elm._trs.ox += attrs.ox;
        elm._trs.x += attrs.ox;
      }
      if (attrs.oy != null) {
        elm._trs.oy += attrs.oy;
        elm._trs.y += attrs.oy;
      }
      RequestDeferredRender(elm._trs.apply, true);
      return elm;
    };
    TRS.move = function(elm, x, y) {
      if (elm._trs == null) {
        err(elm, "Non-TRS element passed to TRS.move");
      }
      return TRS.abs(elm, {
        x: x,
        y: y
      });
    };
    TRS.rotate = function(elm, r) {
      if (elm._trs == null) {
        err(elm, "Non-TRS element passed to TRS.rotate");
      }
      return TRS.abs(elm, {
        r: r
      });
    };
    TRS.scale = function(elm, sx, sy) {
      if (sy == null) {
        sy = x;
      }
      if (elm._trs == null) {
        err(elm, "Non-TRS element passed to TRS.scale");
      }
      return TRS.abs(elm, {
        sx: sx,
        sy: sy
      });
    };
    TRS.origin = function(elm, ox, oy) {
      if (elm._trs == null) {
        err(elm, "Non-TRS element passed to TRS.origin");
      }
      return TRS.abs(elm, {
        ox: ox,
        oy: oy
      });
    };
    return Make("TRS", TRS);
  });

  Take(["Action", "Dispatch", "Global", "Reaction", "root"], function(Action, Dispatch, Global, Reaction, root) {
    var colors, current, setColor;
    colors = ["#666", "#bbb", "#fff"];
    current = 1;
    setColor = function(index) {
      return root.element.style["background-color"] = colors[index % colors.length];
    };
    Reaction("setup", function() {
      return setColor(1);
    });
    return Reaction("cycleBackgroundColor", function() {
      return setColor(++current);
    });
  });

  Take(["Action", "Dispatch", "Global", "Reaction", "root"], function(Action, Dispatch, Global, Reaction, root) {
    Reaction("Schematic:Toggle", function() {
      return Action(Global.animateMode ? "Schematic:Show" : "Schematic:Hide");
    });
    Reaction("Schematic:Hide", function() {
      Global.animateMode = true;
      return Dispatch(root, "animateMode");
    });
    return Reaction("Schematic:Show", function() {
      Global.animateMode = false;
      return Dispatch(root, "schematicMode");
    });
  });

  Take(["Dispatch", "Reaction", "root"], function(Dispatch, Reaction, root) {
    return Reaction("setup", function() {
      return Dispatch(root, "setup");
    });
  });

  Arrow = (function() {
    var getScaleFactor;

    Arrow.prototype.edge = null;

    Arrow.prototype.element = null;

    Arrow.prototype.visible = false;

    Arrow.prototype.deltaFlow = 0;

    Arrow.prototype.vector = null;

    function Arrow(parent1, target, segment1, position1, edgeIndex1, flowArrows1) {
      var self;
      this.parent = parent1;
      this.target = target;
      this.segment = segment1;
      this.position = position1;
      this.edgeIndex = edgeIndex1;
      this.flowArrows = flowArrows1;
      this.update = bind(this.update, this);
      this.setVisibility = bind(this.setVisibility, this);
      this.updateVisibility = bind(this.updateVisibility, this);
      this.setColor = bind(this.setColor, this);
      this.createArrow = bind(this.createArrow, this);
      this.createArrow();
      this.edge = this.segment.edges[this.edgeIndex];
      self = this;
    }

    Arrow.prototype.createArrow = function() {
      var line, triangle;
      this.element = document.createElementNS("http://www.w3.org/2000/svg", "g");
      triangle = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      triangle.setAttributeNS(null, "points", "0,-16 30,0 0,16");
      line = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      line.setAttributeNS(null, "points", "0, 0, -23, 0");
      line.setAttributeNS(null, "fill", "#fff");
      line.setAttributeNS(null, "stroke-width", "11");
      this.element.appendChild(triangle);
      this.element.appendChild(line);
      this.target.appendChild(this.element);
      this.element.setAttributeNS(null, "fill", "blue");
      return this.element.setAttributeNS(null, "stroke", "blue");
    };

    Arrow.prototype.setColor = function(fillColor) {
      this.element.setAttributeNS(null, "fill", fillColor);
      return this.element.setAttributeNS(null, "stroke", fillColor);
    };

    Arrow.prototype.updateVisibility = function() {
      if (this.visible && this.deltaFlow !== 0) {
        if (this.element.style.visibility !== "visible") {
          return this.element.style.visibility = "visible";
        }
      } else {
        if (this.element.style.visibility !== "hidden") {
          return this.element.style.visibility = "hidden";
        }
      }
    };

    Arrow.prototype.setVisibility = function(isVisible) {
      this.visible = isVisible;
      return this.updateVisibility();
    };

    Arrow.prototype.update = function(deltaFlow) {
      var angle, currentPosition, fadeLength, scaleFactor, scalingFactor, transString;
      this.deltaFlow = deltaFlow;
      this.updateVisibility();
      this.position += deltaFlow;
      while (this.position > this.edge.length) {
        this.edgeIndex++;
        if (this.edgeIndex >= this.segment.edges.length) {
          this.edgeIndex = 0;
        }
        this.position -= this.edge.length;
        this.edge = this.segment.edges[this.edgeIndex];
      }
      while (this.position < 0) {
        this.edgeIndex--;
        if (this.edgeIndex < 0) {
          this.edgeIndex = this.segment.edges.length - 1;
        }
        this.edge = this.segment.edges[this.edgeIndex];
        this.position += this.edge.length;
      }
      scaleFactor = 0;
      fadeLength = this.flowArrows ? this.flowArrows.FADE_LENGTH : 50;
      scaleFactor = getScaleFactor(this.position, this.segment.edges, this.edgeIndex, fadeLength);
      scalingFactor = this.segment.scale * this.segment.arrowsContainer.scale;
      if (this.flowArrows) {
        scalingFactor *= this.flowArrows.scale;
      }
      scaleFactor = scaleFactor * scalingFactor;
      currentPosition = {
        x: 0,
        y: 0
      };
      currentPosition.x = Math.cos(this.edge.angle) * this.position + this.edge.x;
      currentPosition.y = Math.sin(this.edge.angle) * this.position + this.edge.y;
      angle = this.edge.angle * 180 / Math.PI + (deltaFlow < 0 ? 180 : 0);
      transString = "translate(" + currentPosition.x + ", " + currentPosition.y + ") scale(" + scaleFactor + ") rotate(" + angle + ")";
      return this.element.setAttribute('transform', transString);
    };

    getScaleFactor = function(position, edges, edgeIndex, fadeLength) {
      var edge, fadeEnd, fadeStart, firstHalf, scale;
      edge = edges[edgeIndex];
      firstHalf = position < edge.length / 2;
      fadeStart = (firstHalf || edges.length > 1) && edgeIndex === 0;
      fadeEnd = (!firstHalf || edges.length > 1) && edgeIndex === edges.length - 1;
      scale = 1;
      if (fadeStart) {
        scale = (position / edge.length) * edge.length / fadeLength;
      } else if (fadeEnd) {
        scale = 1.0 - (position - (edge.length - fadeLength)) / fadeLength;
      }
      return Math.min(1, scale);
    };

    return Arrow;

  })();

  ArrowsContainer = (function() {
    ArrowsContainer.prototype.segments = null;

    ArrowsContainer.prototype.fadeStart = true;

    ArrowsContainer.prototype.fadeEnd = true;

    ArrowsContainer.prototype.direction = 1;

    ArrowsContainer.prototype.scale = 1;

    ArrowsContainer.prototype.name = "";

    ArrowsContainer.prototype.flow = 1;

    function ArrowsContainer(target) {
      this.target = target;
      this.update = bind(this.update, this);
      this.setColor = bind(this.setColor, this);
      this.reverse = bind(this.reverse, this);
      this.visible = bind(this.visible, this);
      this.addSegment = bind(this.addSegment, this);
      this.segments = [];
    }

    ArrowsContainer.prototype.addSegment = function(segment) {
      this.segments.push(segment);
      return this[segment.name] = segment;
    };

    ArrowsContainer.prototype.visible = function(isVisible) {
      var len, m, ref, results, segment;
      ref = this.segments;
      results = [];
      for (m = 0, len = ref.length; m < len; m++) {
        segment = ref[m];
        results.push(segment.visible(isVisible));
      }
      return results;
    };

    ArrowsContainer.prototype.reverse = function() {
      return this.direction *= -1;
    };

    ArrowsContainer.prototype.setColor = function(fillColor) {
      var len, m, ref, results, segment;
      ref = this.segments;
      results = [];
      for (m = 0, len = ref.length; m < len; m++) {
        segment = ref[m];
        results.push(segment.setColor(fillColor));
      }
      return results;
    };

    ArrowsContainer.prototype.update = function(deltaTime) {
      var len, m, ref, results, segment;
      deltaTime *= this.direction;
      ref = this.segments;
      results = [];
      for (m = 0, len = ref.length; m < len; m++) {
        segment = ref[m];
        if (segment.visible) {
          results.push(segment.update(deltaTime, this.flow));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    return ArrowsContainer;

  })();

  Edge = (function() {
    Edge.prototype.x = null;

    Edge.prototype.y = null;

    Edge.prototype.angle = null;

    Edge.prototype.length = null;

    function Edge() {}

    return Edge;

  })();

  Take(["Organizer", "RequestUniqueAnimation"], function(Organizer, RequestUniqueAnimation) {
    var FlowArrows;
    return Make("FlowArrows", FlowArrows = function() {
      var currentTime, removeOriginalArrow, scope, update;
      currentTime = null;
      removeOriginalArrow = function(selectedSymbol) {
        var child, children, len, len1, m, n, ref, results;
        children = [];
        ref = selectedSymbol.childNodes;
        for (m = 0, len = ref.length; m < len; m++) {
          child = ref[m];
          children.push(child);
        }
        results = [];
        for (n = 0, len1 = children.length; n < len1; n++) {
          child = children[n];
          results.push(selectedSymbol.removeChild(child));
        }
        return results;
      };
      update = function(time) {
        var arrowsContainer, dT, len, m, ref, results;
        RequestUniqueAnimation(update);
        if (currentTime == null) {
          currentTime = time;
        }
        dT = (time - currentTime) / 1000;
        currentTime = time;
        if (!scope.isVisible) {
          return;
        }
        ref = scope.arrowsContainers;
        results = [];
        for (m = 0, len = ref.length; m < len; m++) {
          arrowsContainer = ref[m];
          results.push(arrowsContainer.update(dT));
        }
        return results;
      };
      return scope = {
        isVisible: false,
        SPEED: 200,
        MIN_EDGE_LENGTH: 8,
        MIN_SEGMENT_LENGTH: 1,
        CONNECTED_DISTANCE: 1,
        ARROWS_PROPERTY: "arrows",
        scale: 0.75,
        SPACING: 600,
        FADE_LENGTH: 50,
        arrowsContainers: [],
        setup: function(parent, selectedSymbol, linesData) {
          var arrowsContainer, len, lineData, m;
          removeOriginalArrow(selectedSymbol);
          arrowsContainer = new ArrowsContainer(selectedSymbol);
          scope.arrowsContainers.push(arrowsContainer);
          for (m = 0, len = linesData.length; m < len; m++) {
            lineData = linesData[m];
            Organizer.build(parent, lineData.edges, arrowsContainer, this);
          }
          RequestUniqueAnimation(update, true);
          return arrowsContainer;
        },
        show: function() {
          var arrowsContainer, len, m, ref, results;
          scope.isVisible = true;
          ref = scope.arrowsContainers;
          results = [];
          for (m = 0, len = ref.length; m < len; m++) {
            arrowsContainer = ref[m];
            results.push(arrowsContainer.visible(true));
          }
          return results;
        },
        hide: function() {
          var arrowsContainer, len, m, ref, results;
          scope.isVisible = false;
          ref = scope.arrowsContainers;
          results = [];
          for (m = 0, len = ref.length; m < len; m++) {
            arrowsContainer = ref[m];
            results.push(arrowsContainer.visible(false));
          }
          return results;
        },
        start: function() {
          return console.log("FlowArrows.start() is deprecated. Please remove it from your animation.");
        }
      };
    });
  });

  (function() {
    var Organizer, angle, cullShortEdges, cullShortSegments, cullUnusedPoints, distance, edgesToLines, finish, formSegments, isConnected, isInline, joinSegments;
    edgesToLines = function(edgesData) {
      var edge, i, linesData, m, ref;
      linesData = [];
      edge = [];
      for (i = m = 0, ref = edgesData.length - 1; 0 <= ref ? m <= ref : m >= ref; i = 0 <= ref ? ++m : --m) {
        edge = edgesData[i];
        linesData.push(edge[0], edge[2]);
      }
      return linesData;
    };
    formSegments = function(lineData, flowArrows) {
      var i, m, pointA, pointB, ref, segmentEdges, segments;
      segments = [];
      segmentEdges = null;
      for (i = m = 0, ref = lineData.length - 1; m <= ref; i = m += 2) {
        pointA = lineData[i];
        pointB = lineData[i + 1];
        if ((segmentEdges != null) && isConnected(pointA, segmentEdges[segmentEdges.length - 1], flowArrows)) {
          segmentEdges.push(pointB);
        } else if ((segmentEdges != null) && isConnected(pointB, segmentEdges[segmentEdges.length - 1], flowArrows)) {
          segmentEdges.push(pointA);
        } else if ((segmentEdges != null) && isConnected(segmentEdges[0], pointB, flowArrows)) {
          segmentEdges.unshift(pointA);
        } else if ((segmentEdges != null) && isConnected(segmentEdges[0], pointA, flowArrows)) {
          segmentEdges.unshift(pointB);
        } else {
          segmentEdges = [pointA, pointB];
          segments.push(segmentEdges);
        }
      }
      return segments;
    };
    joinSegments = function(segments, flowArrows) {
      var i, j, pointA, pointB, segA, segB;
      segA = null;
      segB = null;
      pointA = null;
      pointB = null;
      i = segments.length;
      while (i--) {
        j = segments.length;
        while (--j > i) {
          segA = segments[i];
          segB = segments[j];
          pointA = segA[0];
          pointB = segB[0];
          if (isConnected(pointA, pointB, flowArrows)) {
            segB.reverse();
            segB.pop();
            segments[i] = segB.concat(segA);
            segments.splice(j, 1);
            continue;
          }
          pointA = segA[segA.length - 1];
          pointB = segB[segB.length - 1];
          if (isConnected(pointA, pointB, flowArrows)) {
            segB.reverse();
            segB.unshift();
            segments[i] = segA.concat(segB);
            segments.splice(j, 1);
            continue;
          }
          pointA = segA[segA.length - 1];
          pointB = segB[0];
          if (isConnected(pointA, pointB, flowArrows)) {
            segments[i] = segA.concat(segB);
            segments.splice(j, 1);
            continue;
          }
          pointA = segA[0];
          pointB = segB[segB.length - 1];
          if (isConnected(pointA, pointB, flowArrows)) {
            segments[i] = segB.concat(segA);
            segments.splice(j, 1);
            continue;
          }
        }
      }
      return segments;
    };
    cullShortEdges = function(segments, flowArrows) {
      var i, j, pointA, pointB, seg;
      i = segments.length;
      seg = [];
      pointA = pointB = null;
      while (i--) {
        seg = segments[i];
        j = seg.length - 1;
        while (j-- > 0) {
          pointA = seg[j];
          pointB = seg[j + 1];
          if (distance(pointA, pointB) < flowArrows.MIN_EDGE_LENGTH) {
            pointA.cull = true;
          }
        }
      }
      i = segments.length;
      while (i--) {
        seg = segments[i];
        j = seg.length - 1;
        while (j-- > 0) {
          if (seg[j].cull) {
            seg.splice(j, 1);
          }
        }
      }
      return segments;
    };
    cullUnusedPoints = function(segments) {
      var i, j, pointA, pointB, pointC, seg;
      seg = [];
      pointA = null;
      pointB = null;
      pointC = null;
      i = segments.length;
      while (i--) {
        seg = segments[i];
        j = seg.length - 2;
        while (j-- > 0 && seg.length > 2) {
          pointA = seg[j];
          pointB = seg[j + 1];
          pointC = seg[j + 2];
          if (isInline(pointA, pointB, pointC)) {
            seg.splice(j + 1, 1);
          }
        }
      }
      return segments;
    };
    cullShortSegments = function(segments, flowArrows) {
      var i;
      i = segments.length;
      while (i--) {
        if (segments.length < flowArrows.MIN_SEGMENT_LENGTH) {
          segments.splice(i, 1);
        }
      }
      return segments;
    };
    finish = function(parent, segments, arrowsContainer, flowArrows) {
      var edge, edges, i, j, m, n, ref, ref1, results, segPoints, segmentLength;
      results = [];
      for (i = m = 0, ref = segments.length - 1; 0 <= ref ? m <= ref : m >= ref; i = 0 <= ref ? ++m : --m) {
        segPoints = segments[i];
        segmentLength = 0;
        edges = [];
        for (j = n = 0, ref1 = segPoints.length - 2; 0 <= ref1 ? n <= ref1 : n >= ref1; j = 0 <= ref1 ? ++n : --n) {
          edge = new Edge();
          edge.x = segPoints[j].x;
          edge.y = segPoints[j].y;
          edge.length = distance(segPoints[j], segPoints[j + 1]);
          edge.angle = angle(segPoints[j], segPoints[j + 1]);
          segmentLength += edge.length;
          edges.push(edge);
        }
        if (segmentLength < flowArrows.MIN_SEGMENT_LENGTH) {
          continue;
        }
        results.push(new Segment(parent, edges, arrowsContainer, segmentLength, flowArrows));
      }
      return results;
    };
    isConnected = function(a, b, flowArrows) {
      var dX, dY;
      dX = Math.abs(a.x - b.x);
      dY = Math.abs(a.y - b.y);
      return dX < flowArrows.CONNECTED_DISTANCE && dY < flowArrows.CONNECTED_DISTANCE;
    };
    isInline = function(a, b, c) {
      var crossproduct, dotproduct, squaredlengthba;
      crossproduct = (c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y);
      if (Math.abs(crossproduct) > 0.01) {
        return false;
      }
      dotproduct = (c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y);
      if (dotproduct < 0) {
        return false;
      }
      squaredlengthba = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
      if (dotproduct > squaredlengthba) {
        return false;
      }
      return true;
    };
    distance = function(a, b) {
      var dx, dy;
      dx = b.x - a.x;
      dy = b.y - a.y;
      return Math.sqrt(dx * dx + dy * dy);
    };
    angle = function(a, b) {
      return Math.atan2(b.y - a.y, b.x - a.x);
    };
    return Make("Organizer", Organizer = {
      build: function(parent, edgesData, arrowsContainer, flowArrows) {
        var lineData, segments;
        lineData = edgesToLines(edgesData);
        segments = [];
        segments = formSegments(lineData, flowArrows);
        segments = joinSegments(segments, flowArrows);
        segments = cullShortEdges(segments, flowArrows);
        segments = cullUnusedPoints(segments);
        return finish(parent, segments, arrowsContainer, flowArrows);
      }
    });
  })();

  Segment = (function() {
    Segment.prototype.arrows = null;

    Segment.prototype.direction = 1;

    Segment.prototype.flow = null;

    Segment.prototype.name = "";

    Segment.prototype.scale = 1.0;

    Segment.prototype.fillColor = "transparent";

    function Segment(parent1, edges1, arrowsContainer1, segmentLength1, flowArrows1) {
      var arrow, edge, edgeIndex, i, m, position, ref, segmentArrows, segmentSpacing, self;
      this.parent = parent1;
      this.edges = edges1;
      this.arrowsContainer = arrowsContainer1;
      this.segmentLength = segmentLength1;
      this.flowArrows = flowArrows1;
      this.update = bind(this.update, this);
      this.setColor = bind(this.setColor, this);
      this.reverse = bind(this.reverse, this);
      this.visible = bind(this.visible, this);
      this.arrows = [];
      this.name = "segment" + this.arrowsContainer.segments.length;
      this.arrowsContainer.addSegment(this);
      self = this;
      segmentArrows = Math.max(1, Math.round(self.segmentLength / this.flowArrows.SPACING));
      segmentSpacing = self.segmentLength / segmentArrows;
      position = 0;
      edgeIndex = 0;
      edge = self.edges[edgeIndex];
      for (i = m = 0, ref = segmentArrows - 1; 0 <= ref ? m <= ref : m >= ref; i = 0 <= ref ? ++m : --m) {
        while (position > edge.length) {
          position -= edge.length;
          edge = self.edges[++edgeIndex];
        }
        arrow = new Arrow(self.parent, self.arrowsContainer.target, self, position, edgeIndex, this.flowArrows);
        arrow.name = "arrow" + i;
        self[arrow.name] = arrow;
        self.arrows.push(arrow);
        position += segmentSpacing;
      }
    }

    Segment.prototype.visible = function(isVisible) {
      var arrow, len, m, ref, results;
      ref = this.arrows;
      results = [];
      for (m = 0, len = ref.length; m < len; m++) {
        arrow = ref[m];
        results.push(arrow.setVisibility(isVisible));
      }
      return results;
    };

    Segment.prototype.reverse = function() {
      return this.direction *= -1;
    };

    Segment.prototype.setColor = function(fillColor) {
      return this.fillColor = fillColor;
    };

    Segment.prototype.update = function(deltaTime, ancestorFlow) {
      var arrow, arrowFlow, len, m, ref, results;
      arrowFlow = this.flow != null ? this.flow : ancestorFlow;
      if (this.flowArrows) {
        arrowFlow *= deltaTime * this.direction * this.flowArrows.SPEED;
      }
      ref = this.arrows;
      results = [];
      for (m = 0, len = ref.length; m < len; m++) {
        arrow = ref[m];
        arrow.setColor(this.fillColor);
        results.push(arrow.update(arrowFlow));
      }
      return results;
    };

    return Segment;

  })();

}).call(this);
