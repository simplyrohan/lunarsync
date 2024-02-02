window.fairygui = window.fgui = {}, function(t) {
    class e {
        constructor() {
            this._asset = Laya.loader;
        }
        static get inst() {
            return e._inst || (e._inst = new e()), e._inst;
        }
        getRes(t) {
            return this._asset.getRes(t);
        }
        load(t, e, i, s, h, r) {
            this._asset.load(t, e, i, s, h, r);
        }
        setAsset(t) {
            this._asset = t;
        }
    }
    t.AssetProxy = e;
}(fgui), function(t) {
    t.AsyncOperation = class {
        constructor() {
            this._itemList = new Array(), this._objectPool = [];
        }
        createObject(e, i) {
            var s = t.UIPackage.getByName(e);
            if (!s) throw new Error("package not found: " + e);
            var h = s.getItemByName(i);
            if (!h) throw new Error("resource not found: " + i);
            this.internalCreateObject(h);
        }
        createObjectFromURL(e) {
            var i = t.UIPackage.getItemByURL(e);
            if (!i) throw new Error("resource not found: " + e);
            this.internalCreateObject(i);
        }
        cancel() {
            if (Laya.timer.clear(this, this.run), this._itemList.length = 0, this._objectPool.length > 0) {
                for (var t = this._objectPool.length, e = 0; e < t; e++) this._objectPool[e].dispose();
                this._objectPool.length = 0;
            }
        }
        internalCreateObject(t) {
            this._itemList.length = 0, this._objectPool.length = 0;
            var e = {
                pi: t,
                type: t.objectType
            };
            e.childCount = this.collectComponentChildren(t), this._itemList.push(e), this._index = 0, 
            Laya.timer.frameLoop(1, this, this.run);
        }
        collectComponentChildren(e) {
            var i, s, h, r, a, n, o = e.rawData;
            o.seek(0, 2);
            var l = o.getInt16();
            for (h = 0; h < l; h++) {
                r = o.getInt16(), a = o.pos, o.seek(a, 0);
                var _ = o.readByte(), d = o.readS(), c = o.readS();
                o.pos = a, null != d ? (i = {
                    pi: s = (n = null != c ? t.UIPackage.getById(c) : e.owner) ? n.getItemById(d) : null,
                    type: _
                }, s && s.type == t.PackageItemType.Component && (i.childCount = this.collectComponentChildren(s))) : (i = {
                    type: _
                }, _ == t.ObjectType.List && (i.listItemCount = this.collectListChildren(o))), this._itemList.push(i), 
                o.pos = a + r;
            }
            return l;
        }
        collectListChildren(e) {
            e.seek(e.pos, 8);
            var i, s, h, r, a, n = 0, o = e.readS(), l = e.getInt16();
            for (i = 0; i < l; i++) s = e.getInt16(), s += e.pos, null == (h = e.readS()) && (h = o), 
            h && (r = t.UIPackage.getItemByURL(h)) && (a = {
                pi: r,
                type: r.objectType
            }, r.type == t.PackageItemType.Component && (a.childCount = this.collectComponentChildren(r)), 
            this._itemList.push(a), n++), e.pos = s;
            return n;
        }
        run() {
            for (var e, i, s, h, r = Laya.Browser.now(), a = t.UIConfig.frameTimeForAsyncUIConstruction, n = this._itemList.length; this._index < n; ) {
                if ((i = this._itemList[this._index]).pi) e = t.UIObjectFactory.newObject(i.pi), 
                this._objectPool.push(e), t.UIPackage._constructing++, i.pi.type == t.PackageItemType.Component ? (s = this._objectPool.length - i.childCount - 1, 
                e.constructFromResource2(this._objectPool, s), this._objectPool.splice(s, i.childCount)) : e.constructFromResource(), 
                t.UIPackage._constructing--; else if (e = t.UIObjectFactory.newObject(i.type), this._objectPool.push(e), 
                i.type == t.ObjectType.List && i.listItemCount > 0) {
                    for (s = this._objectPool.length - i.listItemCount - 1, h = 0; h < i.listItemCount; h++) e.itemPool.returnObject(this._objectPool[h + s]);
                    this._objectPool.splice(s, i.listItemCount);
                }
                if (this._index++, this._index % 5 == 0 && Laya.Browser.now() - r >= a) return;
            }
            Laya.timer.clear(this, this.run);
            var o = this._objectPool[0];
            this._itemList.length = 0, this._objectPool.length = 0, null != this.callback && this.callback.runWith(o);
        }
    };
}(fgui), function(t) {
    var e = 0;
    t.Controller = class extends Laya.EventDispatcher {
        constructor() {
            super(), this._pageIds = [], this._pageNames = [], this._selectedIndex = -1, this._previousIndex = -1;
        }
        dispose() {
            this.offAll();
        }
        get selectedIndex() {
            return this._selectedIndex;
        }
        set selectedIndex(e) {
            if (this._selectedIndex != e) {
                if (e > this._pageIds.length - 1) throw "index out of bounds: " + e;
                this.changing = !0, this._previousIndex = this._selectedIndex, this._selectedIndex = e, 
                this.parent.applyController(this), this.event(t.Events.STATE_CHANGED, this), this.changing = !1;
            }
        }
        setSelectedIndex(t) {
            if (this._selectedIndex != t) {
                if (t > this._pageIds.length - 1) throw "index out of bounds: " + t;
                this.changing = !0, this._previousIndex = this._selectedIndex, this._selectedIndex = t, 
                this.parent.applyController(this), this.changing = !1;
            }
        }
        get previsousIndex() {
            return this._previousIndex;
        }
        get selectedPage() {
            return -1 == this._selectedIndex ? null : this._pageNames[this._selectedIndex];
        }
        set selectedPage(t) {
            var e = this._pageNames.indexOf(t);
            -1 == e && (e = 0), this.selectedIndex = e;
        }
        setSelectedPage(t) {
            var e = this._pageNames.indexOf(t);
            -1 == e && (e = 0), this.setSelectedIndex(e);
        }
        get previousPage() {
            return -1 == this._previousIndex ? null : this._pageNames[this._previousIndex];
        }
        get pageCount() {
            return this._pageIds.length;
        }
        getPageName(t) {
            return this._pageNames[t];
        }
        addPage(t) {
            this.addPageAt(t, this._pageIds.length);
        }
        addPageAt(t, i) {
            var s = "" + e++;
            i == this._pageIds.length ? (this._pageIds.push(s), this._pageNames.push(t)) : (this._pageIds.splice(i, 0, s), 
            this._pageNames.splice(i, 0, t));
        }
        removePage(t) {
            var e = this._pageNames.indexOf(t);
            -1 != e && (this._pageIds.splice(e, 1), this._pageNames.splice(e, 1), this._selectedIndex >= this._pageIds.length ? this.selectedIndex = this._selectedIndex - 1 : this.parent.applyController(this));
        }
        removePageAt(t) {
            this._pageIds.splice(t, 1), this._pageNames.splice(t, 1), this._selectedIndex >= this._pageIds.length ? this.selectedIndex = this._selectedIndex - 1 : this.parent.applyController(this);
        }
        clearPages() {
            this._pageIds.length = 0, this._pageNames.length = 0, -1 != this._selectedIndex ? this.selectedIndex = -1 : this.parent.applyController(this);
        }
        hasPage(t) {
            return -1 != this._pageNames.indexOf(t);
        }
        getPageIndexById(t) {
            return this._pageIds.indexOf(t);
        }
        getPageIdByName(t) {
            var e = this._pageNames.indexOf(t);
            return -1 != e ? this._pageIds[e] : null;
        }
        getPageNameById(t) {
            var e = this._pageIds.indexOf(t);
            return -1 != e ? this._pageNames[e] : null;
        }
        getPageId(t) {
            return this._pageIds[t];
        }
        get selectedPageId() {
            return -1 == this._selectedIndex ? null : this._pageIds[this._selectedIndex];
        }
        set selectedPageId(t) {
            var e = this._pageIds.indexOf(t);
            this.selectedIndex = e;
        }
        set oppositePageId(t) {
            this._pageIds.indexOf(t) > 0 ? this.selectedIndex = 0 : this._pageIds.length > 1 && (this.selectedIndex = 1);
        }
        get previousPageId() {
            return -1 == this._previousIndex ? null : this._pageIds[this._previousIndex];
        }
        runActions() {
            if (this._actions) for (var t = this._actions.length, e = 0; e < t; e++) this._actions[e].run(this, this.previousPageId, this.selectedPageId);
        }
        setup(e) {
            var i, s, h = e.pos;
            e.seek(h, 0), this.name = e.readS(), e.readBool() && (this.autoRadioGroupDepth = !0), 
            e.seek(h, 1);
            var r = e.getInt16();
            for (i = 0; i < r; i++) this._pageIds.push(e.readS()), this._pageNames.push(e.readS());
            var a = 0;
            if (e.version >= 2) switch (e.getByte()) {
              case 1:
                a = e.getInt16();
                break;

              case 2:
                -1 == (a = this._pageNames.indexOf(t.UIPackage.branch)) && (a = 0);
                break;

              case 3:
                -1 == (a = this._pageNames.indexOf(t.UIPackage.getVar(e.readS()))) && (a = 0);
            }
            if (e.seek(h, 2), (r = e.getInt16()) > 0) for (this._actions || (this._actions = []), 
            i = 0; i < r; i++) {
                s = e.getInt16(), s += e.pos;
                var n = t.ControllerAction.createAction(e.readByte());
                n.setup(e), this._actions.push(n), e.pos = s;
            }
            this.parent && this._pageIds.length > 0 ? this._selectedIndex = a : this._selectedIndex = -1;
        }
    };
}(fgui), function(t) {
    class e {
        constructor() {
            this._agent = new t.GLoader(), this._agent.draggable = !0, this._agent.touchable = !1, 
            this._agent.setSize(100, 100), this._agent.setPivot(.5, .5, !0), this._agent.align = "center", 
            this._agent.verticalAlign = "middle", this._agent.sortingOrder = 1e6, this._agent.on(t.Events.DRAG_END, this, this.__dragEnd);
        }
        static get inst() {
            return e._inst || (e._inst = new e()), e._inst;
        }
        get dragAgent() {
            return this._agent;
        }
        get dragging() {
            return null != this._agent.parent;
        }
        startDrag(e, i, s, h) {
            if (!this._agent.parent) {
                this._sourceData = s, this._agent.url = i, t.GRoot.inst.addChild(this._agent);
                var r = t.GRoot.inst.globalToLocal(Laya.stage.mouseX, Laya.stage.mouseY);
                this._agent.setXY(r.x, r.y), this._agent.startDrag(h);
            }
        }
        cancel() {
            this._agent.parent && (this._agent.stopDrag(), t.GRoot.inst.removeChild(this._agent), 
            this._sourceData = null);
        }
        __dragEnd(e) {
            if (this._agent.parent) {
                t.GRoot.inst.removeChild(this._agent);
                var i = this._sourceData;
                this._sourceData = null;
                for (var s = t.GObject.cast(e.target); s; ) {
                    if (s.displayObject.hasListener(t.Events.DROP)) return s.requestFocus(), void s.displayObject.event(t.Events.DROP, [ i, t.Events.createEvent(t.Events.DROP, s.displayObject, e) ]);
                    s = s.parent;
                }
            }
        }
    }
    t.DragDropManager = e;
}(fgui), function(t) {
    class e {
        static createEvent(t, e, i) {
            return this.$event.setTo(t, e, i && i.target || e), this.$event.touchId = i && i.touchId || 0, 
            this.$event.nativeEvent = i, this.$event._stoped = !1, this.$event;
        }
        static dispatch(t, e, i) {
            e.event(t, this.createEvent(t, e, i));
        }
    }
    e.STATE_CHANGED = "fui_state_changed", e.XY_CHANGED = "fui_xy_changed", e.SIZE_CHANGED = "fui_size_changed", 
    e.SIZE_DELAY_CHANGE = "fui_size_delay_change", e.CLICK_ITEM = "fui_click_item", 
    e.SCROLL = "fui_scroll", e.SCROLL_END = "fui_scroll_end", e.DROP = "fui_drop", e.DRAG_START = "fui_drag_start", 
    e.DRAG_MOVE = "fui_drag_move", e.DRAG_END = "fui_drag_end", e.PULL_DOWN_RELEASE = "fui_pull_down_release", 
    e.PULL_UP_RELEASE = "fui_pull_up_release", e.GEAR_STOP = "fui_gear_stop", e.$event = new Laya.Event(), 
    t.Events = e;
}(fgui), function(t) {
    let e, i, s, h, r, a, n, o, l, _, d, c, u, g, p, f, y, m, v, w, C, b;
    !function(t) {
        t[t.Common = 0] = "Common", t[t.Check = 1] = "Check", t[t.Radio = 2] = "Radio";
    }(e = t.ButtonMode || (t.ButtonMode = {})), function(t) {
        t[t.None = 0] = "None", t[t.Both = 1] = "Both", t[t.Height = 2] = "Height";
    }(i = t.AutoSizeType || (t.AutoSizeType = {})), function(t) {
        t[t.Left = 0] = "Left", t[t.Center = 1] = "Center", t[t.Right = 2] = "Right";
    }(s = t.AlignType || (t.AlignType = {})), function(t) {
        t[t.Top = 0] = "Top", t[t.Middle = 1] = "Middle", t[t.Bottom = 2] = "Bottom";
    }(h = t.VertAlignType || (t.VertAlignType = {})), function(t) {
        t[t.None = 0] = "None", t[t.Scale = 1] = "Scale", t[t.ScaleMatchHeight = 2] = "ScaleMatchHeight", 
        t[t.ScaleMatchWidth = 3] = "ScaleMatchWidth", t[t.ScaleFree = 4] = "ScaleFree", 
        t[t.ScaleNoBorder = 5] = "ScaleNoBorder";
    }(r = t.LoaderFillType || (t.LoaderFillType = {})), function(t) {
        t[t.SingleColumn = 0] = "SingleColumn", t[t.SingleRow = 1] = "SingleRow", t[t.FlowHorizontal = 2] = "FlowHorizontal", 
        t[t.FlowVertical = 3] = "FlowVertical", t[t.Pagination = 4] = "Pagination";
    }(a = t.ListLayoutType || (t.ListLayoutType = {})), function(t) {
        t[t.Single = 0] = "Single", t[t.Multiple = 1] = "Multiple", t[t.Multiple_SingleClick = 2] = "Multiple_SingleClick", 
        t[t.None = 3] = "None";
    }(n = t.ListSelectionMode || (t.ListSelectionMode = {})), function(t) {
        t[t.Visible = 0] = "Visible", t[t.Hidden = 1] = "Hidden", t[t.Scroll = 2] = "Scroll";
    }(o = t.OverflowType || (t.OverflowType = {})), function(t) {
        t[t.Image = 0] = "Image", t[t.MovieClip = 1] = "MovieClip", t[t.Sound = 2] = "Sound", 
        t[t.Component = 3] = "Component", t[t.Atlas = 4] = "Atlas", t[t.Font = 5] = "Font", 
        t[t.Swf = 6] = "Swf", t[t.Misc = 7] = "Misc", t[t.Unknown = 8] = "Unknown", t[t.Spine = 9] = "Spine", 
        t[t.DragonBones = 10] = "DragonBones";
    }(l = t.PackageItemType || (t.PackageItemType = {})), function(t) {
        t[t.Image = 0] = "Image", t[t.MovieClip = 1] = "MovieClip", t[t.Swf = 2] = "Swf", 
        t[t.Graph = 3] = "Graph", t[t.Loader = 4] = "Loader", t[t.Group = 5] = "Group", 
        t[t.Text = 6] = "Text", t[t.RichText = 7] = "RichText", t[t.InputText = 8] = "InputText", 
        t[t.Component = 9] = "Component", t[t.List = 10] = "List", t[t.Label = 11] = "Label", 
        t[t.Button = 12] = "Button", t[t.ComboBox = 13] = "ComboBox", t[t.ProgressBar = 14] = "ProgressBar", 
        t[t.Slider = 15] = "Slider", t[t.ScrollBar = 16] = "ScrollBar", t[t.Tree = 17] = "Tree", 
        t[t.Loader3D = 18] = "Loader3D";
    }(_ = t.ObjectType || (t.ObjectType = {})), function(t) {
        t[t.Percent = 0] = "Percent", t[t.ValueAndMax = 1] = "ValueAndMax", t[t.Value = 2] = "Value", 
        t[t.Max = 3] = "Max";
    }(d = t.ProgressTitleType || (t.ProgressTitleType = {})), function(t) {
        t[t.Default = 0] = "Default", t[t.Visible = 1] = "Visible", t[t.Auto = 2] = "Auto", 
        t[t.Hidden = 3] = "Hidden";
    }(c = t.ScrollBarDisplayType || (t.ScrollBarDisplayType = {})), function(t) {
        t[t.Horizontal = 0] = "Horizontal", t[t.Vertical = 1] = "Vertical", t[t.Both = 2] = "Both";
    }(u = t.ScrollType || (t.ScrollType = {})), function(t) {
        t[t.None = 0] = "None", t[t.Horizontal = 1] = "Horizontal", t[t.Vertical = 2] = "Vertical", 
        t[t.Both = 3] = "Both";
    }(g = t.FlipType || (t.FlipType = {})), function(t) {
        t[t.Ascent = 0] = "Ascent", t[t.Descent = 1] = "Descent", t[t.Arch = 2] = "Arch";
    }(p = t.ChildrenRenderOrder || (t.ChildrenRenderOrder = {})), function(t) {
        t[t.None = 0] = "None", t[t.Horizontal = 1] = "Horizontal", t[t.Vertical = 2] = "Vertical";
    }(f = t.GroupLayoutType || (t.GroupLayoutType = {})), function(t) {
        t[t.Auto = 0] = "Auto", t[t.Up = 1] = "Up", t[t.Down = 2] = "Down";
    }(y = t.PopupDirection || (t.PopupDirection = {})), function(t) {
        t[t.Left_Left = 0] = "Left_Left", t[t.Left_Center = 1] = "Left_Center", t[t.Left_Right = 2] = "Left_Right", 
        t[t.Center_Center = 3] = "Center_Center", t[t.Right_Left = 4] = "Right_Left", t[t.Right_Center = 5] = "Right_Center", 
        t[t.Right_Right = 6] = "Right_Right", t[t.Top_Top = 7] = "Top_Top", t[t.Top_Middle = 8] = "Top_Middle", 
        t[t.Top_Bottom = 9] = "Top_Bottom", t[t.Middle_Middle = 10] = "Middle_Middle", t[t.Bottom_Top = 11] = "Bottom_Top", 
        t[t.Bottom_Middle = 12] = "Bottom_Middle", t[t.Bottom_Bottom = 13] = "Bottom_Bottom", 
        t[t.Width = 14] = "Width", t[t.Height = 15] = "Height", t[t.LeftExt_Left = 16] = "LeftExt_Left", 
        t[t.LeftExt_Right = 17] = "LeftExt_Right", t[t.RightExt_Left = 18] = "RightExt_Left", 
        t[t.RightExt_Right = 19] = "RightExt_Right", t[t.TopExt_Top = 20] = "TopExt_Top", 
        t[t.TopExt_Bottom = 21] = "TopExt_Bottom", t[t.BottomExt_Top = 22] = "BottomExt_Top", 
        t[t.BottomExt_Bottom = 23] = "BottomExt_Bottom", t[t.Size = 24] = "Size";
    }(m = t.RelationType || (t.RelationType = {})), function(t) {
        t[t.None = 0] = "None", t[t.Horizontal = 1] = "Horizontal", t[t.Vertical = 2] = "Vertical", 
        t[t.Radial90 = 3] = "Radial90", t[t.Radial180 = 4] = "Radial180", t[t.Radial360 = 5] = "Radial360";
    }(v = t.FillMethod || (t.FillMethod = {})), function(t) {
        t[t.Top = 0] = "Top", t[t.Bottom = 1] = "Bottom", t[t.Left = 2] = "Left", t[t.Right = 3] = "Right", 
        t[t.TopLeft = 0] = "TopLeft", t[t.TopRight = 1] = "TopRight", t[t.BottomLeft = 2] = "BottomLeft", 
        t[t.BottomRight = 3] = "BottomRight";
    }(w = t.FillOrigin || (t.FillOrigin = {})), function(t) {
        t[t.TopLeft = 0] = "TopLeft", t[t.TopRight = 1] = "TopRight", t[t.BottomLeft = 2] = "BottomLeft", 
        t[t.BottomRight = 3] = "BottomRight";
    }(C = t.FillOrigin90 || (t.FillOrigin90 = {})), function(t) {
        t[t.Text = 0] = "Text", t[t.Icon = 1] = "Icon", t[t.Color = 2] = "Color", t[t.OutlineColor = 3] = "OutlineColor", 
        t[t.Playing = 4] = "Playing", t[t.Frame = 5] = "Frame", t[t.DeltaTime = 6] = "DeltaTime", 
        t[t.TimeScale = 7] = "TimeScale", t[t.FontSize = 8] = "FontSize", t[t.Selected = 9] = "Selected";
    }(b = t.ObjectPropID || (t.ObjectPropID = {}));
}(fgui), function(t) {
    class e {
        constructor() {
            this._x = 0, this._y = 0, this._alpha = 1, this._rotation = 0, this._visible = !0, 
            this._touchable = !0, this._scaleX = 1, this._scaleY = 1, this._skewX = 0, this._skewY = 0, 
            this._pivotX = 0, this._pivotY = 0, this._pivotOffsetX = 0, this._pivotOffsetY = 0, 
            this._sortingOrder = 0, this._internalVisible = !0, this._yOffset = 0, this.minWidth = 0, 
            this.minHeight = 0, this.maxWidth = 0, this.maxHeight = 0, this.sourceWidth = 0, 
            this.sourceHeight = 0, this.initWidth = 0, this.initHeight = 0, this._width = 0, 
            this._height = 0, this._rawWidth = 0, this._rawHeight = 0, this._sizePercentInGroup = 0, 
            this._id = "" + h++, this._name = "", this.createDisplayObject(), this._relations = new t.Relations(this), 
            this._gears = new Array(10);
        }
        get id() {
            return this._id;
        }
        get name() {
            return this._name;
        }
        set name(t) {
            this._name = t;
        }
        get x() {
            return this._x;
        }
        set x(t) {
            this.setXY(t, this._y);
        }
        get y() {
            return this._y;
        }
        set y(t) {
            this.setXY(this._x, t);
        }
        setXY(s, h) {
            if (this._x != s || this._y != h) {
                var r = s - this._x, n = h - this._y;
                this._x = s, this._y = h, this.handleXYChanged(), this instanceof t.GGroup && this.moveChildren(r, n), 
                this.updateGear(1), !this._parent || this._parent instanceof t.GList || (this._parent.setBoundsChangedFlag(), 
                this._group && this._group.setBoundsChangedFlag(!0), this.displayObject.event(t.Events.XY_CHANGED)), 
                e.draggingObject != this || i || this.localToGlobalRect(0, 0, this.width, this.height, a);
            }
        }
        get xMin() {
            return this._pivotAsAnchor ? this._x - this._width * this._pivotX : this._x;
        }
        set xMin(t) {
            this._pivotAsAnchor ? this.setXY(t + this._width * this._pivotX, this._y) : this.setXY(t, this._y);
        }
        get yMin() {
            return this._pivotAsAnchor ? this._y - this._height * this._pivotY : this._y;
        }
        set yMin(t) {
            this._pivotAsAnchor ? this.setXY(this._x, t + this._height * this._pivotY) : this.setXY(this._x, t);
        }
        get pixelSnapping() {
            return this._pixelSnapping;
        }
        set pixelSnapping(t) {
            this._pixelSnapping != t && (this._pixelSnapping = t, this.handleXYChanged());
        }
        center(e) {
            var i;
            i = this._parent ? this.parent : this.root, this.setXY((i.width - this.width) / 2, (i.height - this.height) / 2), 
            e && (this.addRelation(i, t.RelationType.Center_Center), this.addRelation(i, t.RelationType.Middle_Middle));
        }
        get width() {
            return this.ensureSizeCorrect(), this._relations.sizeDirty && this._relations.ensureRelationsSizeCorrect(), 
            this._width;
        }
        set width(t) {
            this.setSize(t, this._rawHeight);
        }
        get height() {
            return this.ensureSizeCorrect(), this._relations.sizeDirty && this._relations.ensureRelationsSizeCorrect(), 
            this._height;
        }
        set height(t) {
            this.setSize(this._rawWidth, t);
        }
        setSize(e, i, s) {
            if (this._rawWidth != e || this._rawHeight != i) {
                this._rawWidth = e, this._rawHeight = i, e < this.minWidth && (e = this.minWidth), 
                i < this.minHeight && (i = this.minHeight), this.maxWidth > 0 && e > this.maxWidth && (e = this.maxWidth), 
                this.maxHeight > 0 && i > this.maxHeight && (i = this.maxHeight);
                var h = e - this._width, r = i - this._height;
                this._width = e, this._height = i, this.handleSizeChanged(), 0 == this._pivotX && 0 == this._pivotY || (this._pivotAsAnchor ? this.applyPivot() : (s || this.setXY(this.x - this._pivotX * h, this.y - this._pivotY * r), 
                this.updatePivotOffset())), this instanceof t.GGroup && this.resizeChildren(h, r), 
                this.updateGear(2), this._parent && (this._relations.onOwnerSizeChanged(h, r, this._pivotAsAnchor || !s), 
                this._parent.setBoundsChangedFlag(), this._group && this._group.setBoundsChangedFlag()), 
                this.displayObject.event(t.Events.SIZE_CHANGED);
            }
        }
        ensureSizeCorrect() {}
        makeFullScreen() {
            this.setSize(t.GRoot.inst.width, t.GRoot.inst.height);
        }
        get actualWidth() {
            return this.width * Math.abs(this._scaleX);
        }
        get actualHeight() {
            return this.height * Math.abs(this._scaleY);
        }
        get scaleX() {
            return this._scaleX;
        }
        set scaleX(t) {
            this.setScale(t, this._scaleY);
        }
        get scaleY() {
            return this._scaleY;
        }
        set scaleY(t) {
            this.setScale(this._scaleX, t);
        }
        setScale(t, e) {
            this._scaleX == t && this._scaleY == e || (this._scaleX = t, this._scaleY = e, this.handleScaleChanged(), 
            this.applyPivot(), this.updateGear(2));
        }
        get skewX() {
            return this._skewX;
        }
        set skewX(t) {
            this.setSkew(t, this._skewY);
        }
        get skewY() {
            return this._skewY;
        }
        set skewY(t) {
            this.setSkew(this._skewX, t);
        }
        setSkew(t, e) {
            this._skewX == t && this._skewY == e || (this._skewX = t, this._skewY = e, this._displayObject && (this._displayObject.skew(-t, e), 
            this.applyPivot()));
        }
        get pivotX() {
            return this._pivotX;
        }
        set pivotX(t) {
            this.setPivot(t, this._pivotY);
        }
        get pivotY() {
            return this._pivotY;
        }
        set pivotY(t) {
            this.setPivot(this._pivotX, t);
        }
        setPivot(t, e = 0, i) {
            this._pivotX == t && this._pivotY == e && this._pivotAsAnchor == i || (this._pivotX = t, 
            this._pivotY = e, this._pivotAsAnchor = i, this.updatePivotOffset(), this.handleXYChanged());
        }
        get pivotAsAnchor() {
            return this._pivotAsAnchor;
        }
        internalSetPivot(t, e, i) {
            this._pivotX = t, this._pivotY = e, this._pivotAsAnchor = i, this._pivotAsAnchor && this.handleXYChanged();
        }
        updatePivotOffset() {
            if (this._displayObject) if (!this._displayObject.transform || 0 == this._pivotX && 0 == this._pivotY) this._pivotOffsetX = 0, 
            this._pivotOffsetY = 0; else {
                n.x = this._pivotX * this._width, n.y = this._pivotY * this._height;
                var t = this._displayObject.transform.transformPoint(n);
                this._pivotOffsetX = this._pivotX * this._width - t.x, this._pivotOffsetY = this._pivotY * this._height - t.y;
            }
        }
        applyPivot() {
            0 == this._pivotX && 0 == this._pivotY || (this.updatePivotOffset(), this.handleXYChanged());
        }
        get touchable() {
            return this._touchable;
        }
        set touchable(e) {
            if (this._touchable != e) {
                if (this._touchable = e, this.updateGear(3), this instanceof t.GImage || this instanceof t.GMovieClip || this instanceof t.GTextField && !(this instanceof t.GTextInput) && !(this instanceof t.GRichTextField)) return;
                this._displayObject && (this._displayObject.mouseEnabled = this._touchable);
            }
        }
        get grayed() {
            return this._grayed;
        }
        set grayed(t) {
            this._grayed != t && (this._grayed = t, this.handleGrayedChanged(), this.updateGear(3));
        }
        get enabled() {
            return !this._grayed && this._touchable;
        }
        set enabled(t) {
            this.grayed = !t, this.touchable = t;
        }
        get rotation() {
            return this._rotation;
        }
        set rotation(t) {
            this._rotation != t && (this._rotation = t, this._displayObject && (this._displayObject.rotation = this.normalizeRotation, 
            this.applyPivot()), this.updateGear(3));
        }
        get normalizeRotation() {
            var t = this._rotation % 360;
            return t > 180 ? t -= 360 : t < -180 && (t = 360 + t), t;
        }
        get alpha() {
            return this._alpha;
        }
        set alpha(t) {
            this._alpha != t && (this._alpha = t, this.handleAlphaChanged(), this.updateGear(3));
        }
        get visible() {
            return this._visible;
        }
        set visible(t) {
            this._visible != t && (this._visible = t, this.handleVisibleChanged(), this._parent && this._parent.setBoundsChangedFlag(), 
            this._group && this._group.excludeInvisibles && this._group.setBoundsChangedFlag());
        }
        get internalVisible() {
            return this._internalVisible && (!this._group || this._group.internalVisible) && !this._displayObject._cacheStyle.maskParent;
        }
        get internalVisible2() {
            return this._visible && (!this._group || this._group.internalVisible2);
        }
        get internalVisible3() {
            return this._internalVisible && this._visible;
        }
        get sortingOrder() {
            return this._sortingOrder;
        }
        set sortingOrder(t) {
            if (t < 0 && (t = 0), this._sortingOrder != t) {
                var e = this._sortingOrder;
                this._sortingOrder = t, this._parent && this._parent.childSortingOrderChanged(this, e, this._sortingOrder);
            }
        }
        get focused() {
            return this.root.focus == this;
        }
        requestFocus() {
            this.root.focus = this;
        }
        get tooltips() {
            return this._tooltips;
        }
        set tooltips(t) {
            this._tooltips && (this.off(Laya.Event.ROLL_OVER, this, this.__rollOver), this.off(Laya.Event.ROLL_OUT, this, this.__rollOut)), 
            this._tooltips = t, this._tooltips && (this.on(Laya.Event.ROLL_OVER, this, this.__rollOver), 
            this.on(Laya.Event.ROLL_OUT, this, this.__rollOut));
        }
        __rollOver(t) {
            Laya.timer.once(100, this, this.__doShowTooltips);
        }
        __doShowTooltips() {
            this.root && this.root.showTooltips(this._tooltips);
        }
        __rollOut(t) {
            Laya.timer.clear(this, this.__doShowTooltips), this.root.hideTooltips();
        }
        get blendMode() {
            return this._displayObject.blendMode;
        }
        set blendMode(t) {
            this._displayObject.blendMode = t;
        }
        get filters() {
            return this._displayObject.filters;
        }
        set filters(t) {
            this._displayObject.filters = t;
        }
        get inContainer() {
            return null != this._displayObject && null != this._displayObject.parent;
        }
        get onStage() {
            return null != this._displayObject && null != this._displayObject.stage;
        }
        get resourceURL() {
            return this.packageItem ? "ui://" + this.packageItem.owner.id + this.packageItem.id : null;
        }
        set group(t) {
            this._group != t && (this._group && this._group.setBoundsChangedFlag(), this._group = t, 
            this._group && this._group.setBoundsChangedFlag());
        }
        get group() {
            return this._group;
        }
        getGear(e) {
            var i = this._gears[e];
            return i || (this._gears[e] = i = t.GearBase.create(this, e)), i;
        }
        updateGear(t) {
            if (!this._underConstruct && !this._gearLocked) {
                var e = this._gears[t];
                e && e.controller && e.updateState();
            }
        }
        checkGearController(t, e) {
            return this._gears[t] && this._gears[t].controller == e;
        }
        updateGearFromRelations(t, e, i) {
            this._gears[t] && this._gears[t].updateFromRelations(e, i);
        }
        addDisplayLock() {
            var t = this._gears[0];
            if (t && t.controller) {
                var e = t.addLock();
                return this.checkGearDisplay(), e;
            }
            return 0;
        }
        releaseDisplayLock(t) {
            var e = this._gears[0];
            e && e.controller && (e.releaseLock(t), this.checkGearDisplay());
        }
        checkGearDisplay() {
            if (!this._handlingController) {
                var t = !this._gears[0] || this._gears[0].connected;
                this._gears[8] && (t = this._gears[8].evaluate(t)), t != this._internalVisible && (this._internalVisible = t, 
                this._parent && (this._parent.childStateChanged(this), this._group && this._group.excludeInvisibles && this._group.setBoundsChangedFlag()));
            }
        }
        get relations() {
            return this._relations;
        }
        addRelation(t, e, i) {
            this._relations.add(t, e, i);
        }
        removeRelation(t, e) {
            this._relations.remove(t, e);
        }
        get displayObject() {
            return this._displayObject;
        }
        get parent() {
            return this._parent;
        }
        set parent(t) {
            this._parent = t;
        }
        removeFromParent() {
            this._parent && this._parent.removeChild(this);
        }
        get root() {
            if (this instanceof t.GRoot) return this;
            for (var e = this._parent; e; ) {
                if (e instanceof t.GRoot) return e;
                e = e.parent;
            }
            return t.GRoot.inst;
        }
        get asCom() {
            return this;
        }
        get asButton() {
            return this;
        }
        get asLabel() {
            return this;
        }
        get asProgress() {
            return this;
        }
        get asTextField() {
            return this;
        }
        get asRichTextField() {
            return this;
        }
        get asTextInput() {
            return this;
        }
        get asLoader() {
            return this;
        }
        get asList() {
            return this;
        }
        get asTree() {
            return this;
        }
        get asGraph() {
            return this;
        }
        get asGroup() {
            return this;
        }
        get asSlider() {
            return this;
        }
        get asComboBox() {
            return this;
        }
        get asImage() {
            return this;
        }
        get asMovieClip() {
            return this;
        }
        get text() {
            return null;
        }
        set text(t) {}
        get icon() {
            return null;
        }
        set icon(t) {}
        get treeNode() {
            return this._treeNode;
        }
        get isDisposed() {
            return null == this._displayObject;
        }
        dispose() {
            this.removeFromParent(), this._relations.dispose(), this._displayObject.destroy(), 
            this._displayObject = null;
            for (var t = 0; t < 10; t++) {
                var e = this._gears[t];
                e && e.dispose();
            }
        }
        onClick(t, e, i) {
            this.on(Laya.Event.CLICK, t, e, i);
        }
        offClick(t, e) {
            this.off(Laya.Event.CLICK, t, e);
        }
        hasClickListener() {
            return this._displayObject.hasListener(Laya.Event.CLICK);
        }
        on(t, e, i, s) {
            this._displayObject.on(t, e, i, s);
        }
        off(t, e, i) {
            this._displayObject.off(t, e, i);
        }
        get draggable() {
            return this._draggable;
        }
        set draggable(t) {
            this._draggable != t && (this._draggable = t, this.initDrag());
        }
        get dragBounds() {
            return this._dragBounds;
        }
        set dragBounds(t) {
            this._dragBounds = t;
        }
        startDrag(t) {
            null != this._displayObject.stage && this.dragBegin(t);
        }
        stopDrag() {
            this.dragEnd();
        }
        get dragging() {
            return e.draggingObject == this;
        }
        localToGlobal(t, e, i) {
            return t = t || 0, e = e || 0, this._pivotAsAnchor && (t += this._pivotX * this._width, 
            e += this._pivotY * this._height), (i = i || new Laya.Point()).x = t, i.y = e, this._displayObject.localToGlobal(i, !1);
        }
        globalToLocal(t, e, i) {
            return t = t || 0, e = e || 0, (i = i || new Laya.Point()).x = t, i.y = e, i = this._displayObject.globalToLocal(i, !1), 
            this._pivotAsAnchor && (i.x -= this._pivotX * this._width, i.y -= this._pivotY * this._height), 
            i;
        }
        localToGlobalRect(t, e, i, s, h) {
            t = t || 0, e = e || 0, i = i || 0, s = s || 0, h = h || new Laya.Rectangle();
            var r = this.localToGlobal(t, e);
            return h.x = r.x, h.y = r.y, r = this.localToGlobal(t + i, e + s), h.width = r.x - h.x, 
            h.height = r.y - h.y, h;
        }
        globalToLocalRect(t, e, i, s, h) {
            t = t || 0, e = e || 0, i = i || 0, s = s || 0, h = h || new Laya.Rectangle();
            var r = this.globalToLocal(t, e);
            return h.x = r.x, h.y = r.y, r = this.globalToLocal(t + i, e + s), h.width = r.x - h.x, 
            h.height = r.y - h.y, h;
        }
        handleControllerChanged(t) {
            this._handlingController = !0;
            for (var e = 0; e < 10; e++) {
                var i = this._gears[e];
                i && i.controller == t && i.apply();
            }
            this._handlingController = !1, this.checkGearDisplay();
        }
        createDisplayObject() {
            this._displayObject = new Laya.Sprite(), this._displayObject.$owner = this;
        }
        handleXYChanged() {
            var t = this._x, e = this._y + this._yOffset;
            this._pivotAsAnchor && (t -= this._pivotX * this._width, e -= this._pivotY * this._height), 
            this._pixelSnapping && (t = Math.round(t), e = Math.round(e)), this._displayObject.pos(t + this._pivotOffsetX, e + this._pivotOffsetY);
        }
        handleSizeChanged() {
            this._displayObject.size(this._width, this._height);
        }
        handleScaleChanged() {
            this._displayObject.scale(this._scaleX, this._scaleY, !0);
        }
        handleGrayedChanged() {
            t.ToolSet.setColorFilter(this._displayObject, this._grayed);
        }
        handleAlphaChanged() {
            this._displayObject.alpha = this._alpha;
        }
        handleVisibleChanged() {
            this._displayObject.visible = this.internalVisible2;
        }
        getProp(e) {
            switch (e) {
              case t.ObjectPropID.Text:
                return this.text;

              case t.ObjectPropID.Icon:
                return this.icon;

              case t.ObjectPropID.Color:
              case t.ObjectPropID.OutlineColor:
                return null;

              case t.ObjectPropID.Playing:
                return !1;

              case t.ObjectPropID.Frame:
              case t.ObjectPropID.DeltaTime:
                return 0;

              case t.ObjectPropID.TimeScale:
                return 1;

              case t.ObjectPropID.FontSize:
                return 0;

              case t.ObjectPropID.Selected:
                return !1;

              default:
                return;
            }
        }
        setProp(e, i) {
            switch (e) {
              case t.ObjectPropID.Text:
                this.text = i;
                break;

              case t.ObjectPropID.Icon:
                this.icon = i;
            }
        }
        constructFromResource() {}
        setup_beforeAdd(e, i) {
            var s, h;
            e.seek(i, 0), e.skip(5), this._id = e.readS(), this._name = e.readS(), s = e.getInt32(), 
            h = e.getInt32(), this.setXY(s, h), e.readBool() && (this.initWidth = e.getInt32(), 
            this.initHeight = e.getInt32(), this.setSize(this.initWidth, this.initHeight, !0)), 
            e.readBool() && (this.minWidth = e.getInt32(), this.maxWidth = e.getInt32(), this.minHeight = e.getInt32(), 
            this.maxHeight = e.getInt32()), e.readBool() && (s = e.getFloat32(), h = e.getFloat32(), 
            this.setScale(s, h)), e.readBool() && (s = e.getFloat32(), h = e.getFloat32(), this.setSkew(s, h)), 
            e.readBool() && (s = e.getFloat32(), h = e.getFloat32(), this.setPivot(s, h, e.readBool())), 
            1 != (s = e.getFloat32()) && (this.alpha = s), 0 != (s = e.getFloat32()) && (this.rotation = s), 
            e.readBool() || (this.visible = !1), e.readBool() || (this.touchable = !1), e.readBool() && (this.grayed = !0);
            var r = e.readByte();
            t.BlendMode[r] && (this.blendMode = t.BlendMode[r]), 1 == e.readByte() && t.ToolSet.setColorFilter(this._displayObject, [ e.getFloat32(), e.getFloat32(), e.getFloat32(), e.getFloat32() ]);
            var a = e.readS();
            null != a && (this.data = a);
        }
        setup_afterAdd(t, e) {
            t.seek(e, 1);
            var i = t.readS();
            null != i && (this.tooltips = i);
            var s = t.getInt16();
            s >= 0 && (this.group = this.parent.getChildAt(s)), t.seek(e, 2);
            for (var h = t.getInt16(), r = 0; r < h; r++) {
                var a = t.getInt16();
                a += t.pos, this.getGear(t.readByte()).setup(t), t.pos = a;
            }
        }
        initDrag() {
            this._draggable ? this.on(Laya.Event.MOUSE_DOWN, this, this.__begin) : this.off(Laya.Event.MOUSE_DOWN, this, this.__begin);
        }
        dragBegin(i) {
            if (e.draggingObject) {
                let s = e.draggingObject;
                s.stopDrag(), e.draggingObject = null, t.Events.dispatch(t.Events.DRAG_END, s._displayObject, {
                    touchId: i
                });
            }
            r.x = Laya.stage.mouseX, r.y = Laya.stage.mouseY, this.localToGlobalRect(0, 0, this.width, this.height, a), 
            this._dragTesting = !0, e.draggingObject = this, Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.__moving), 
            Laya.stage.on(Laya.Event.MOUSE_UP, this, this.__end);
        }
        dragEnd() {
            e.draggingObject == this && (this.reset(), this._dragTesting = !1, e.draggingObject = null), 
            s = !1;
        }
        reset() {
            Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.__moving), Laya.stage.off(Laya.Event.MOUSE_UP, this, this.__end);
        }
        __begin() {
            this._dragStartPos || (this._dragStartPos = new Laya.Point()), this._dragStartPos.x = Laya.stage.mouseX, 
            this._dragStartPos.y = Laya.stage.mouseY, this._dragTesting = !0, Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.__moving), 
            Laya.stage.on(Laya.Event.MOUSE_UP, this, this.__end);
        }
        __moving(h) {
            if (e.draggingObject != this && this._draggable && this._dragTesting) {
                var l = t.UIConfig.touchDragSensitivity;
                if (this._dragStartPos && Math.abs(this._dragStartPos.x - Laya.stage.mouseX) < l && Math.abs(this._dragStartPos.y - Laya.stage.mouseY) < l) return;
                this._dragTesting = !1, s = !0, t.Events.dispatch(t.Events.DRAG_START, this._displayObject, h), 
                s && this.dragBegin();
            }
            if (e.draggingObject == this) {
                var _ = Laya.stage.mouseX - r.x + a.x, d = Laya.stage.mouseY - r.y + a.y;
                if (this._dragBounds) {
                    var c = t.GRoot.inst.localToGlobalRect(this._dragBounds.x, this._dragBounds.y, this._dragBounds.width, this._dragBounds.height, o);
                    _ < c.x ? _ = c.x : _ + a.width > c.right && (_ = c.right - a.width) < c.x && (_ = c.x), 
                    d < c.y ? d = c.y : d + a.height > c.bottom && (d = c.bottom - a.height) < c.y && (d = c.y);
                }
                i = !0;
                var u = this.parent.globalToLocal(_, d, n);
                this.setXY(Math.round(u.x), Math.round(u.y)), i = !1, t.Events.dispatch(t.Events.DRAG_MOVE, this._displayObject, h);
            }
        }
        __end(i) {
            e.draggingObject == this ? (e.draggingObject = null, this.reset(), t.Events.dispatch(t.Events.DRAG_END, this._displayObject, i)) : this._dragTesting && (this._dragTesting = !1, 
            this.reset());
        }
        static cast(t) {
            return t.$owner;
        }
    }
    t.GObject = e, t.BlendMode = {
        2: Laya.BlendMode.LIGHTER,
        3: Laya.BlendMode.MULTIPLY,
        4: Laya.BlendMode.SCREEN
    };
    var i, s, h = 0, r = new Laya.Point(), a = new Laya.Rectangle(), n = new Laya.Point(), o = new Laya.Rectangle();
}(fgui), function(t) {
    t.GTextField = class extends t.GObject {
        constructor() {
            super();
        }
        get font() {
            return null;
        }
        set font(t) {}
        get fontSize() {
            return 0;
        }
        set fontSize(t) {}
        get color() {
            return null;
        }
        set color(t) {}
        get align() {
            return null;
        }
        set align(t) {}
        get valign() {
            return null;
        }
        set valign(t) {}
        get leading() {
            return 0;
        }
        set leading(t) {}
        get letterSpacing() {
            return 0;
        }
        set letterSpacing(t) {}
        get bold() {
            return !1;
        }
        set bold(t) {}
        get italic() {
            return !1;
        }
        set italic(t) {}
        get underline() {
            return !1;
        }
        set underline(t) {}
        get singleLine() {
            return !1;
        }
        set singleLine(t) {}
        get stroke() {
            return 0;
        }
        set stroke(t) {}
        get strokeColor() {
            return null;
        }
        set strokeColor(t) {}
        set ubbEnabled(t) {
            this._ubbEnabled = t;
        }
        get ubbEnabled() {
            return this._ubbEnabled;
        }
        get autoSize() {
            return this._autoSize;
        }
        set autoSize(e) {
            this._autoSize != e && (this._autoSize = e, this._widthAutoSize = this._autoSize == t.AutoSizeType.Both, 
            this._heightAutoSize = this._autoSize == t.AutoSizeType.Both || this._autoSize == t.AutoSizeType.Height, 
            this.updateAutoSize());
        }
        updateAutoSize() {}
        get textWidth() {
            return 0;
        }
        parseTemplate(t) {
            for (var e, i, s, h, r = 0, a = ""; -1 != (e = t.indexOf("{", r)); ) if (e > 0 && 92 == t.charCodeAt(e - 1)) a += t.substring(r, e - 1), 
            a += "{", r = e + 1; else {
                if (a += t.substring(r, e), r = e, -1 == (e = t.indexOf("}", r))) break;
                e != r + 1 ? (-1 != (i = (s = t.substring(r + 1, e)).indexOf("=")) ? a += null == (h = this._templateVars[s.substring(0, i)]) ? s.substring(i + 1) : h : null != (h = this._templateVars[s]) && (a += h), 
                r = e + 1) : (a += t.substr(r, 2), r = e + 1);
            }
            return r < t.length && (a += t.substr(r)), a;
        }
        get templateVars() {
            return this._templateVars;
        }
        set templateVars(t) {
            (this._templateVars || t) && (this._templateVars = t, this.flushVars());
        }
        setVar(t, e) {
            return this._templateVars || (this._templateVars = {}), this._templateVars[t] = e, 
            this;
        }
        flushVars() {
            this.text = this._text;
        }
        getProp(e) {
            switch (e) {
              case t.ObjectPropID.Color:
                return this.color;

              case t.ObjectPropID.OutlineColor:
                return this.strokeColor;

              case t.ObjectPropID.FontSize:
                return this.fontSize;

              default:
                return super.getProp(e);
            }
        }
        setProp(e, i) {
            switch (e) {
              case t.ObjectPropID.Color:
                this.color = i;
                break;

              case t.ObjectPropID.OutlineColor:
                this.strokeColor = i;
                break;

              case t.ObjectPropID.FontSize:
                this.fontSize = i;
                break;

              default:
                super.setProp(e, i);
            }
        }
        setup_beforeAdd(t, e) {
            var i;
            super.setup_beforeAdd(t, e), t.seek(e, 5), this.font = t.readS(), this.fontSize = t.getInt16(), 
            this.color = t.readColorS(), i = t.readByte(), this.align = 0 == i ? "left" : 1 == i ? "center" : "right", 
            i = t.readByte(), this.valign = 0 == i ? "top" : 1 == i ? "middle" : "bottom", this.leading = t.getInt16(), 
            this.letterSpacing = t.getInt16(), this.ubbEnabled = t.readBool(), this.autoSize = t.readByte(), 
            this.underline = t.readBool(), this.italic = t.readBool(), this.bold = t.readBool(), 
            this.singleLine = t.readBool(), t.readBool() && (this.strokeColor = t.readColorS(), 
            this.stroke = t.getFloat32() + 1), t.readBool() && t.skip(12), t.readBool() && (this._templateVars = {});
        }
        setup_afterAdd(t, e) {
            super.setup_afterAdd(t, e), t.seek(e, 6);
            var i = t.readS();
            null != i && (this.text = i);
        }
    };
}(fgui), function(t) {
    t.GBasicTextField = class extends t.GTextField {
        constructor() {
            super(), this._letterSpacing = 0, this._textWidth = 0, this._textHeight = 0, this._text = "", 
            this._color = "#000000", this._textField.align = "left", this._textField.font = t.UIConfig.defaultFont, 
            this._autoSize = t.AutoSizeType.Both, this._widthAutoSize = this._heightAutoSize = !0, 
            this._textField._sizeDirty = !1;
        }
        createDisplayObject() {
            this._displayObject = this._textField = new e(this), this._displayObject.$owner = this, 
            this._displayObject.mouseEnabled = !1;
        }
        get nativeText() {
            return this._textField;
        }
        set text(e) {
            if (this._text = e, null == this._text && (this._text = ""), null == this._bitmapFont) {
                this._widthAutoSize && (this._textField.width = 1e4);
                var i = this._text;
                this._templateVars && (i = this.parseTemplate(i)), this._ubbEnabled ? this._textField.text = t.UBBParser.inst.parse(t.ToolSet.encodeHTML(i), !0) : this._textField.text = i;
            } else this._textField.text = "", this._textField.setChanged();
            this.parent && this.parent._underConstruct && this._textField.typeset();
        }
        get text() {
            return this._text;
        }
        get font() {
            return this._textField.font;
        }
        set font(e) {
            this._font = e, t.ToolSet.startsWith(this._font, "ui://") ? this._bitmapFont = t.UIPackage.getItemAssetByURL(this._font) : delete this._bitmapFont, 
            this._bitmapFont ? this._textField.setChanged() : this._font ? this._textField.font = this._font : this._textField.font = t.UIConfig.defaultFont;
        }
        get fontSize() {
            return this._textField.fontSize;
        }
        set fontSize(t) {
            this._textField.fontSize = t;
        }
        get color() {
            return this._color;
        }
        set color(t) {
            this._color != t && (this._color = t, this.updateGear(4), this.grayed ? this._textField.color = "#AAAAAA" : this._textField.color = this._color);
        }
        get align() {
            return this._textField.align;
        }
        set align(t) {
            this._textField.align = t;
        }
        get valign() {
            return this._textField.valign;
        }
        set valign(t) {
            this._textField.valign = t;
        }
        get leading() {
            return this._textField.leading;
        }
        set leading(t) {
            this._textField.leading = t;
        }
        get letterSpacing() {
            return this._letterSpacing;
        }
        set letterSpacing(t) {
            this._letterSpacing = t;
        }
        get bold() {
            return false;
        }
        set bold(t) {
            this._textField.bold = false;
        }
        get italic() {
            return this._textField.italic;
        }
        set italic(t) {
            this._textField.italic = t;
        }
        get underline() {
            return this._textField.underline;
        }
        set underline(t) {
            this._textField.underline = t;
        }
        get singleLine() {
            return this._singleLine;
        }
        set singleLine(t) {
            this._singleLine = t, this._textField.wordWrap = !this._widthAutoSize && !this._singleLine;
        }
        get stroke() {
            return this._textField.stroke;
        }
        set stroke(t) {
            this._textField.stroke = t;
        }
        get strokeColor() {
            return this._textField.strokeColor;
        }
        set strokeColor(t) {
            this._textField.strokeColor != t && (this._textField.strokeColor = t, this.updateGear(4));
        }
        updateAutoSize() {
            this._textField.wordWrap = !this._widthAutoSize && !this._singleLine, this._underConstruct || (this._heightAutoSize ? this._widthAutoSize || (this._textField.width = this.width) : this._textField.size(this.width, this.height));
        }
        get textWidth() {
            return this._textField._isChanged && this._textField.typeset(), this._textWidth;
        }
        ensureSizeCorrect() {
            !this._underConstruct && this._textField._isChanged && this._textField.typeset();
        }
        typeset() {
            this._bitmapFont ? this.renderWithBitmapFont() : (this._widthAutoSize || this._heightAutoSize) && this.updateSize();
        }
        updateSize() {
            this._textWidth = Math.ceil(this._textField.textWidth), this._textHeight = Math.ceil(this._textField.textHeight);
            var t, e = 0;
            this._widthAutoSize ? (t = this._textWidth, this._textField.width != t && (this._textField.width = t, 
            "left" != this._textField.align && this._textField.baseTypeset())) : t = this.width, 
            this._heightAutoSize ? (e = this._textHeight, this._widthAutoSize || this._textField.height != this._textHeight && (this._textField.height = this._textHeight)) : (e = this.height, 
            this._textHeight > e && (this._textHeight = e), this._textField.height != this._textHeight && (this._textField.height = this._textHeight)), 
            this._updatingSize = !0, this.setSize(t, e), this._updatingSize = !1;
        }
        renderWithBitmapFont() {
            var e = this._displayObject.graphics;
            e.clear(), this._lines ? function(t) {
                for (var e = t.length, s = 0; s < e; s++) {
                    var h = t[s];
                    i.push(h);
                }
                t.length = 0;
            }(this._lines) : this._lines = new Array();
            var r, a = this.leading - 1, n = this.width - 2 * s, o = 0, l = 0, _ = 0, d = 0, c = 0, u = 0, g = 0, p = 0, f = 0, y = "", m = h, v = !this._widthAutoSize && !this._singleLine, w = this.fontSize, C = this._bitmapFont.resizable ? w / this._bitmapFont.size : 1;
            this._textWidth = 0, this._textHeight = 0;
            var b = this._text;
            this._templateVars && (b = this.parseTemplate(b));
            for (var S = b.length, x = 0; x < S; ++x) {
                var I = b.charAt(x), T = I.charCodeAt(0);
                if (10 != T) {
                    if (T >= 65 && T <= 90 || T >= 97 && T <= 122 ? (0 == u && (g = o), u++) : (u > 0 && (p = o), 
                    u = 0), 32 == T) d = Math.ceil(w / 2), c = w; else {
                        var P = this._bitmapFont.glyphs[I];
                        P ? (d = Math.ceil(P.advance * C), c = Math.ceil(P.lineHeight * C)) : (d = 0, c = 0);
                    }
                    if (c > _ && (_ = c), c > l && (l = c), 0 != o && (o += this._letterSpacing), o += d, 
                    !v || o <= n) y += I; else {
                        if ((r = borrow()).height = l, r.textHeight = _, 0 == y.length) r.text = I; else if (u > 0 && p > 0) {
                            var L = (y += I).length - u;
                            r.text = t.ToolSet.trimRight(y.substr(0, L)), r.width = p, y = y.substr(L), o -= g;
                        } else r.text = y, r.width = o - (d + this._letterSpacing), y = I, o = d, l = c, 
                        _ = c;
                        r.y = m, m += r.height + a, r.width > this._textWidth && (this._textWidth = r.width), 
                        u = 0, g = 0, p = 0, this._lines.push(r);
                    }
                } else y += I, (r = borrow()).width = o, 0 == _ && (0 == f && (f = w), 0 == l && (l = f), 
                _ = l), r.height = l, f = l, r.textHeight = _, r.text = y, r.y = m, m += r.height + a, 
                r.width > this._textWidth && (this._textWidth = r.width), this._lines.push(r), y = "", 
                o = 0, l = 0, _ = 0, u = 0, g = 0, p = 0;
            }
            y.length > 0 && ((r = borrow()).width = o, 0 == l && (l = f), 0 == _ && (_ = l), 
            r.height = l, r.textHeight = _, r.text = y, r.y = m, r.width > this._textWidth && (this._textWidth = r.width), 
            this._lines.push(r)), this._textWidth > 0 && (this._textWidth += 2 * s), 0 == this._lines.length ? this._textHeight = 0 : (r = this._lines[this._lines.length - 1], 
            this._textHeight = r.y + r.height + h);
            var O, k = 0;
            if (O = this._widthAutoSize ? 0 == this._textWidth ? 0 : this._textWidth : this.width, 
            k = this._heightAutoSize ? 0 == this._textHeight ? 0 : this._textHeight : this.height, 
            this._updatingSize = !0, this.setSize(O, k), this._updatingSize = !1, this.doAlign(), 
            0 != O && 0 != k) {
                var B = s, z = 0, j = 0;
                n = this.width - 2 * s;
                for (var M = this._lines.length, A = this._bitmapFont.tint ? this._color : null, E = 0; E < M; E++) {
                    r = this._lines[E], B = s, z = "center" == this.align ? (n - r.width) / 2 : "right" == this.align ? n - r.width : 0, 
                    S = r.text.length;
                    for (var F = 0; F < S; F++) 10 != (T = (I = r.text.charAt(F)).charCodeAt(0)) && (32 != T ? (P = this._bitmapFont.glyphs[I]) ? (j = (r.height + r.textHeight) / 2 - Math.ceil(P.lineHeight * C), 
                    P.texture && e.drawTexture(P.texture, B + z + Math.ceil(P.x * C), r.y + j + Math.ceil(P.y * C), P.width * C, P.height * C, null, 1, A), 
                    B += this._letterSpacing + Math.ceil(P.advance * C)) : B += this._letterSpacing : B += this._letterSpacing + Math.ceil(w / 2));
                }
            }
        }
        handleSizeChanged() {
            this._updatingSize || (this._underConstruct ? this._textField.size(this._width, this._height) : this._bitmapFont ? this._widthAutoSize ? this.doAlign() : this._textField.setChanged() : this._widthAutoSize || (this._heightAutoSize ? this._textField.width = this._width : this._textField.size(this._width, this._height)));
        }
        handleGrayedChanged() {
            super.handleGrayedChanged(), this.grayed ? this._textField.color = "#AAAAAA" : this._textField.color = this._color;
        }
        doAlign() {
            if ("top" == this.valign || 0 == this._textHeight) this._yOffset = h; else {
                var t = this.height - this._textHeight;
                t < 0 && (t = 0), "middle" == this.valign ? this._yOffset = Math.floor(t / 2) : this._yOffset = Math.floor(t);
            }
            this.handleXYChanged();
        }
        flushVars() {
            this.text = this._text;
        }
    };
    class e extends Laya.Text {
        constructor(t) {
            super(), this._owner = t;
        }
        baseTypeset() {
            this._lock = !0, this.typeset(), this._lock = !1;
        }
        typeset() {
            this._sizeDirty = !0, super.typeset(), this._lock || this._owner.typeset(), this._isChanged && (Laya.timer.clear(this, this.typeset), 
            this._isChanged = !1), this._sizeDirty = !1;
        }
        setChanged() {
            this.isChanged = !0;
        }
        set isChanged(e) {
            e && !this._sizeDirty && this._owner.autoSize != t.AutoSizeType.None && this._owner.parent && (this._sizeDirty = !0, 
            this.event(t.Events.SIZE_DELAY_CHANGE)), super.isChanged = e;
        }
    }
    var i = [];
    function borrow() {
        if (i.length) {
            var t = i.pop();
            return t.width = 0, t.height = 0, t.textHeight = 0, t.text = null, t.y = 0, t;
        }
        return {
            width: 0,
            height: 0,
            textHeight: 0,
            text: null,
            y: 0
        };
    }
    const s = 2, h = 2;
}(fgui), function(t) {
    t.Margin = class {
        constructor() {
            this.left = 0, this.right = 0, this.top = 0, this.bottom = 0;
        }
        copy(t) {
            this.top = t.top, this.bottom = t.bottom, this.left = t.left, this.right = t.right;
        }
    };
}(fgui), function(t) {
    class e extends t.GObject {
        constructor() {
            super(), this._sortingChildCount = 0, this._children = [], this._controllers = [], 
            this._transitions = [], this._margin = new t.Margin(), this._alignOffset = new Laya.Point(), 
            this._opaque = !1, this._childrenRenderOrder = 0, this._apexIndex = 0;
        }
        createDisplayObject() {
            super.createDisplayObject(), this._displayObject.mouseEnabled = !0, this._displayObject.mouseThrough = !0, 
            this._container = this._displayObject;
        }
        dispose() {
            var t, e;
            for (e = this._transitions.length, t = 0; t < e; ++t) {
                this._transitions[t].dispose();
            }
            for (e = this._controllers.length, t = 0; t < e; ++t) {
                this._controllers[t].dispose();
            }
            for (this.scrollPane && this.scrollPane.dispose(), t = (e = this._children.length) - 1; t >= 0; --t) {
                var i = this._children[t];
                i.parent = null, i.dispose();
            }
            this._boundsChanged = !1, super.dispose();
        }
        get displayListContainer() {
            return this._container;
        }
        addChild(t) {
            return this.addChildAt(t, this._children.length), t;
        }
        addChildAt(t, e) {
            if (!t) throw "child is null";
            if (e >= 0 && e <= this._children.length) {
                if (t.parent == this) this.setChildIndex(t, e); else {
                    t.removeFromParent(), t.parent = this;
                    var i = this._children.length;
                    0 != t.sortingOrder ? (this._sortingChildCount++, e = this.getInsertPosForSortingChild(t)) : this._sortingChildCount > 0 && e > i - this._sortingChildCount && (e = i - this._sortingChildCount), 
                    e == i ? this._children.push(t) : this._children.splice(e, 0, t), this.childStateChanged(t), 
                    this.setBoundsChangedFlag();
                }
                return t;
            }
            throw "Invalid child index";
        }
        getInsertPosForSortingChild(t) {
            var e = this._children.length, i = 0;
            for (i = 0; i < e; i++) {
                var s = this._children[i];
                if (s != t && t.sortingOrder < s.sortingOrder) break;
            }
            return i;
        }
        removeChild(t, e) {
            var i = this._children.indexOf(t);
            return -1 != i && this.removeChildAt(i, e), t;
        }
        removeChildAt(e, i) {
            if (e >= 0 && e < this._children.length) {
                var s = this._children[e];
                return s.parent = null, 0 != s.sortingOrder && this._sortingChildCount--, this._children.splice(e, 1), 
                s.group = null, s.inContainer && (this._container.removeChild(s.displayObject), 
                this._childrenRenderOrder == t.ChildrenRenderOrder.Arch && Laya.timer.callLater(this, this.buildNativeDisplayList)), 
                i && s.dispose(), this.setBoundsChangedFlag(), s;
            }
            throw "Invalid child index";
        }
        removeChildren(t, e, i) {
            null == t && (t = 0), null == e && (e = -1), (e < 0 || e >= this._children.length) && (e = this._children.length - 1);
            for (var s = t; s <= e; ++s) this.removeChildAt(t, i);
        }
        getChildAt(t) {
            if (t >= 0 && t < this._children.length) return this._children[t];
            throw "Invalid child index";
        }
        getChild(t) {
            for (var e = this._children.length, i = 0; i < e; ++i) if (this._children[i].name == t) return this._children[i];
            return null;
        }
        getChildByPath(t) {
            for (var i, s = t.split("."), h = s.length, r = this, a = 0; a < h && (i = r.getChild(s[a])); ++a) if (a != h - 1) {
                if (!(i instanceof e)) {
                    i = null;
                    break;
                }
                r = i;
            }
            return i;
        }
        getVisibleChild(t) {
            for (var e = this._children.length, i = 0; i < e; ++i) {
                var s = this._children[i];
                if (s.internalVisible && s.internalVisible2 && s.name == t) return s;
            }
            return null;
        }
        getChildInGroup(t, e) {
            for (var i = this._children.length, s = 0; s < i; ++s) {
                var h = this._children[s];
                if (h.group == e && h.name == t) return h;
            }
            return null;
        }
        getChildById(t) {
            for (var e = this._children.length, i = 0; i < e; ++i) if (this._children[i]._id == t) return this._children[i];
            return null;
        }
        getChildIndex(t) {
            return this._children.indexOf(t);
        }
        setChildIndex(t, e) {
            var i = this._children.indexOf(t);
            if (-1 == i) throw "Not a child of this container";
            if (0 == t.sortingOrder) {
                var s = this._children.length;
                this._sortingChildCount > 0 && e > s - this._sortingChildCount - 1 && (e = s - this._sortingChildCount - 1), 
                this._setChildIndex(t, i, e);
            }
        }
        setChildIndexBefore(t, e) {
            var i = this._children.indexOf(t);
            if (-1 == i) throw "Not a child of this container";
            if (0 != t.sortingOrder) return i;
            var s = this._children.length;
            return this._sortingChildCount > 0 && e > s - this._sortingChildCount - 1 && (e = s - this._sortingChildCount - 1), 
            i < e ? this._setChildIndex(t, i, e - 1) : this._setChildIndex(t, i, e);
        }
        _setChildIndex(e, i, s) {
            var h = this._children.length;
            if (s > h && (s = h), i == s) return i;
            if (this._children.splice(i, 1), this._children.splice(s, 0, e), e.inContainer) {
                var r, a = 0;
                if (this._childrenRenderOrder == t.ChildrenRenderOrder.Ascent) {
                    for (r = 0; r < s; r++) this._children[r].inContainer && a++;
                    a == this._container.numChildren && a--, this._container.setChildIndex(e.displayObject, a);
                } else if (this._childrenRenderOrder == t.ChildrenRenderOrder.Descent) {
                    for (r = h - 1; r > s; r--) this._children[r].inContainer && a++;
                    a == this._container.numChildren && a--, this._container.setChildIndex(e.displayObject, a);
                } else Laya.timer.callLater(this, this.buildNativeDisplayList);
                this.setBoundsChangedFlag();
            }
            return s;
        }
        swapChildren(t, e) {
            var i = this._children.indexOf(t), s = this._children.indexOf(e);
            if (-1 == i || -1 == s) throw "Not a child of this container";
            this.swapChildrenAt(i, s);
        }
        swapChildrenAt(t, e) {
            var i = this._children[t], s = this._children[e];
            this.setChildIndex(i, e), this.setChildIndex(s, t);
        }
        get numChildren() {
            return this._children.length;
        }
        isAncestorOf(t) {
            if (!t) return !1;
            for (var e = t.parent; e; ) {
                if (e == this) return !0;
                e = e.parent;
            }
            return !1;
        }
        addController(t) {
            this._controllers.push(t), t.parent = this, this.applyController(t);
        }
        getControllerAt(t) {
            return this._controllers[t];
        }
        getController(t) {
            for (var e = this._controllers.length, i = 0; i < e; ++i) {
                var s = this._controllers[i];
                if (s.name == t) return s;
            }
            return null;
        }
        removeController(t) {
            var e = this._controllers.indexOf(t);
            if (-1 == e) throw new Error("controller not exists");
            t.parent = null, this._controllers.splice(e, 1);
            for (var i = this._children.length, s = 0; s < i; s++) {
                this._children[s].handleControllerChanged(t);
            }
        }
        get controllers() {
            return this._controllers;
        }
        childStateChanged(e) {
            if (!this._buildingDisplayList) {
                var i = this._children.length;
                if (e instanceof t.GGroup) for (var s = 0; s < i; s++) {
                    var h = this._children[s];
                    h.group == e && this.childStateChanged(h);
                } else if (e.displayObject) if (e.internalVisible && e.displayObject != this._displayObject.mask) {
                    if (!e.displayObject.parent) {
                        var r = 0;
                        if (this._childrenRenderOrder == t.ChildrenRenderOrder.Ascent) {
                            for (s = 0; s < i && (h = this._children[s]) != e; s++) h.displayObject && h.displayObject.parent && r++;
                            this._container.addChildAt(e.displayObject, r);
                        } else if (this._childrenRenderOrder == t.ChildrenRenderOrder.Descent) {
                            for (s = i - 1; s >= 0 && (h = this._children[s]) != e; s--) h.displayObject && h.displayObject.parent && r++;
                            this._container.addChildAt(e.displayObject, r);
                        } else this._container.addChild(e.displayObject), Laya.timer.callLater(this, this.buildNativeDisplayList);
                    }
                } else e.displayObject.parent && (this._container.removeChild(e.displayObject), 
                this._childrenRenderOrder == t.ChildrenRenderOrder.Arch && Laya.timer.callLater(this, this.buildNativeDisplayList));
            }
        }
        buildNativeDisplayList() {
            if (this._displayObject) {
                var e, i, s = this._children.length;
                if (0 != s) switch (this._childrenRenderOrder) {
                  case t.ChildrenRenderOrder.Ascent:
                    for (e = 0; e < s; e++) (i = this._children[e]).displayObject && i.internalVisible && this._container.addChild(i.displayObject);
                    break;

                  case t.ChildrenRenderOrder.Descent:
                    for (e = s - 1; e >= 0; e--) (i = this._children[e]).displayObject && i.internalVisible && this._container.addChild(i.displayObject);
                    break;

                  case t.ChildrenRenderOrder.Arch:
                    var h = t.ToolSet.clamp(this._apexIndex, 0, s);
                    for (e = 0; e < h; e++) (i = this._children[e]).displayObject && i.internalVisible && this._container.addChild(i.displayObject);
                    for (e = s - 1; e >= h; e--) (i = this._children[e]).displayObject && i.internalVisible && this._container.addChild(i.displayObject);
                }
            }
        }
        applyController(t) {
            this._applyingController = t;
            for (var e = this._children.length, i = 0; i < e; i++) this._children[i].handleControllerChanged(t);
            this._applyingController = null, t.runActions();
        }
        applyAllControllers() {
            for (var t = this._controllers.length, e = 0; e < t; ++e) this.applyController(this._controllers[e]);
        }
        adjustRadioGroupDepth(e, i) {
            var s, h, r = this._children.length, a = -1, n = -1;
            for (s = 0; s < r; s++) (h = this._children[s]) == e ? a = s : h instanceof t.GButton && h.relatedController == i && s > n && (n = s);
            a < n && (this._applyingController && this._children[n].handleControllerChanged(this._applyingController), 
            this.swapChildrenAt(a, n));
        }
        getTransitionAt(t) {
            return this._transitions[t];
        }
        getTransition(t) {
            for (var e = this._transitions.length, i = 0; i < e; ++i) {
                var s = this._transitions[i];
                if (s.name == t) return s;
            }
            return null;
        }
        isChildInView(t) {
            return this._displayObject.scrollRect ? t.x + t.width >= 0 && t.x <= this.width && t.y + t.height >= 0 && t.y <= this.height : !this._scrollPane || this._scrollPane.isChildInView(t);
        }
        getFirstChildInView() {
            for (var t = this._children.length, e = 0; e < t; ++e) {
                var i = this._children[e];
                if (this.isChildInView(i)) return e;
            }
            return -1;
        }
        get scrollPane() {
            return this._scrollPane;
        }
        get opaque() {
            return this._opaque;
        }
        set opaque(t) {
            this._opaque != t && (this._opaque = t, this._opaque ? (this._displayObject.hitArea || (this._displayObject.hitArea = new Laya.Rectangle()), 
            this._displayObject.hitArea instanceof Laya.Rectangle && this._displayObject.hitArea.setTo(0, 0, this._width, this._height), 
            this._displayObject.mouseThrough = !1) : (this._displayObject.hitArea instanceof Laya.Rectangle && (this._displayObject.hitArea = null), 
            this._displayObject.mouseThrough = !0));
        }
        get margin() {
            return this._margin;
        }
        set margin(t) {
            this._margin.copy(t), this._displayObject.scrollRect && this._container.pos(this._margin.left + this._alignOffset.x, this._margin.top + this._alignOffset.y), 
            this.handleSizeChanged();
        }
        get childrenRenderOrder() {
            return this._childrenRenderOrder;
        }
        set childrenRenderOrder(t) {
            this._childrenRenderOrder != t && (this._childrenRenderOrder = t, this.buildNativeDisplayList());
        }
        get apexIndex() {
            return this._apexIndex;
        }
        set apexIndex(e) {
            this._apexIndex != e && (this._apexIndex = e, this._childrenRenderOrder == t.ChildrenRenderOrder.Arch && this.buildNativeDisplayList());
        }
        get mask() {
            return this._mask;
        }
        set mask(t) {
            this.setMask(t, !1);
        }
        setMask(e, i) {
            if (this._mask && this._mask != e && "destination-out" == this._mask.blendMode && (this._mask.blendMode = null), 
            this._mask = e, !this._mask) return this._displayObject.mask = null, void (this._displayObject.hitArea instanceof t.ChildHitArea && (this._displayObject.hitArea = null));
            this._mask.hitArea && (this._displayObject.hitArea = new t.ChildHitArea(this._mask, i), 
            this._displayObject.mouseThrough = !1, this._displayObject.hitTestPrior = !0), i ? (this._displayObject.mask = null, 
            this._displayObject.cacheAs = "bitmap", this._mask.blendMode = "destination-out") : this._displayObject.mask = this._mask;
        }
        get baseUserData() {
            var t = this.packageItem.rawData;
            return t.seek(0, 4), t.readS();
        }
        updateHitArea() {
            if (this._displayObject.hitArea instanceof t.PixelHitTest) {
                var e = this._displayObject.hitArea;
                0 != this.sourceWidth && (e.scaleX = this._width / this.sourceWidth), 0 != this.sourceHeight && (e.scaleY = this._height / this.sourceHeight);
            } else this._displayObject.hitArea instanceof Laya.Rectangle && this._displayObject.hitArea.setTo(0, 0, this._width, this._height);
        }
        updateMask() {
            var t = this._displayObject.scrollRect;
            t || (t = new Laya.Rectangle()), t.x = this._margin.left, t.y = this._margin.top, 
            t.width = this._width - this._margin.right, t.height = this._height - this._margin.bottom, 
            this._displayObject.scrollRect = t;
        }
        setupScroll(e) {
            this._displayObject == this._container && (this._container = new Laya.Sprite(), 
            this._displayObject.addChild(this._container)), this._scrollPane = new t.ScrollPane(this), 
            this._scrollPane.setup(e);
        }
        setupOverflow(e) {
            e == t.OverflowType.Hidden ? (this._displayObject == this._container && (this._container = new Laya.Sprite(), 
            this._displayObject.addChild(this._container)), this.updateMask(), this._container.pos(this._margin.left, this._margin.top)) : 0 == this._margin.left && 0 == this._margin.top || (this._displayObject == this._container && (this._container = new Laya.Sprite(), 
            this._displayObject.addChild(this._container)), this._container.pos(this._margin.left, this._margin.top));
        }
        handleSizeChanged() {
            super.handleSizeChanged(), this._scrollPane ? this._scrollPane.onOwnerSizeChanged() : this._displayObject.scrollRect && this.updateMask(), 
            this._displayObject.hitArea && this.updateHitArea();
        }
        handleGrayedChanged() {
            var t = this.getController("grayed");
            if (t) t.selectedIndex = this.grayed ? 1 : 0; else for (var e = this.grayed, i = this._children.length, s = 0; s < i; ++s) this._children[s].grayed = e;
        }
        handleControllerChanged(t) {
            super.handleControllerChanged(t), this._scrollPane && this._scrollPane.handleControllerChanged(t);
        }
        setBoundsChangedFlag() {
            (this._scrollPane || this._trackBounds) && (this._boundsChanged || (this._boundsChanged = !0, 
            Laya.timer.callLater(this, this.__render)));
        }
        __render() {
            if (this._boundsChanged) {
                var t = 0, e = this._children.length;
                for (t = 0; t < e; t++) this._children[t].ensureSizeCorrect();
                this.updateBounds();
            }
        }
        ensureBoundsCorrect() {
            var t = 0, e = this._children.length;
            for (t = 0; t < e; t++) this._children[t].ensureSizeCorrect();
            this._boundsChanged && this.updateBounds();
        }
        updateBounds() {
            var t = 0, e = 0, i = 0, s = 0, h = this._children.length;
            if (h > 0) {
                t = Number.POSITIVE_INFINITY, e = Number.POSITIVE_INFINITY;
                var r = Number.NEGATIVE_INFINITY, a = Number.NEGATIVE_INFINITY, n = 0, o = 0;
                for (o = 0; o < h; o++) {
                    var l = this._children[o];
                    (n = l.x) < t && (t = n), (n = l.y) < e && (e = n), (n = l.x + l.actualWidth) > r && (r = n), 
                    (n = l.y + l.actualHeight) > a && (a = n);
                }
                i = r - t, s = a - e;
            }
            this.setBounds(t, e, i, s);
        }
        setBounds(t, e, i, s) {
            this._boundsChanged = !1, this._scrollPane && this._scrollPane.setContentSize(Math.round(t + i), Math.round(e + s));
        }
        get viewWidth() {
            return this._scrollPane ? this._scrollPane.viewWidth : this.width - this._margin.left - this._margin.right;
        }
        set viewWidth(t) {
            this._scrollPane ? this._scrollPane.viewWidth = t : this.width = t + this._margin.left + this._margin.right;
        }
        get viewHeight() {
            return this._scrollPane ? this._scrollPane.viewHeight : this.height - this._margin.top - this._margin.bottom;
        }
        set viewHeight(t) {
            this._scrollPane ? this._scrollPane.viewHeight = t : this.height = t + this._margin.top + this._margin.bottom;
        }
        getSnappingPosition(t, e, i) {
            return this.getSnappingPositionWithDir(t, e, 0, 0, i);
        }
        getSnappingPositionWithDir(t, e, i, s, h) {
            h || (h = new Laya.Point());
            var r = this._children.length;
            if (0 == r) return h.x = 0, h.y = 0, h;
            this.ensureBoundsCorrect();
            var a = null, n = null, o = 0;
            if (0 != e) {
                for (;o < r; o++) if (e < (a = this._children[o]).y) {
                    if (0 == o) {
                        e = 0;
                        break;
                    }
                    e = e < (n = this._children[o - 1]).y + n.actualHeight / 2 ? n.y : a.y;
                    break;
                }
                o == r && (e = a.y);
            }
            if (0 != t) {
                for (o > 0 && o--; o < r; o++) if (t < (a = this._children[o]).x) {
                    if (0 == o) {
                        t = 0;
                        break;
                    }
                    t = t < (n = this._children[o - 1]).x + n.actualWidth / 2 ? n.x : a.x;
                    break;
                }
                o == r && (t = a.x);
            }
            return h.x = t, h.y = e, h;
        }
        childSortingOrderChanged(t, e, i) {
            if (0 == i) this._sortingChildCount--, this.setChildIndex(t, this._children.length); else {
                0 == e && this._sortingChildCount++;
                var s = this._children.indexOf(t), h = this.getInsertPosForSortingChild(t);
                s < h ? this._setChildIndex(t, s, h - 1) : this._setChildIndex(t, s, h);
            }
        }
        constructFromResource() {
            this.constructFromResource2(null, 0);
        }
        constructFromResource2(e, i) {
            var s, h, r, a, n, o, l, _, d = this.packageItem.getBranch();
            d.decoded || (d.decoded = !0, t.TranslationHelper.translateComponent(d));
            var c = d.rawData;
            c.seek(0, 0), this._underConstruct = !0, this.sourceWidth = c.getInt32(), this.sourceHeight = c.getInt32(), 
            this.initWidth = this.sourceWidth, this.initHeight = this.sourceHeight, this.setSize(this.sourceWidth, this.sourceHeight), 
            c.readBool() && (this.minWidth = c.getInt32(), this.maxWidth = c.getInt32(), this.minHeight = c.getInt32(), 
            this.maxHeight = c.getInt32()), c.readBool() && (n = c.getFloat32(), o = c.getFloat32(), 
            this.internalSetPivot(n, o, c.readBool())), c.readBool() && (this._margin.top = c.getInt32(), 
            this._margin.bottom = c.getInt32(), this._margin.left = c.getInt32(), this._margin.right = c.getInt32());
            var u = c.readByte();
            if (u == t.OverflowType.Scroll) {
                var g = c.pos;
                c.seek(0, 7), this.setupScroll(c), c.pos = g;
            } else this.setupOverflow(u);
            c.readBool() && c.skip(8), this._buildingDisplayList = !0, c.seek(0, 1);
            var p, f = c.getInt16();
            for (s = 0; s < f; s++) {
                a = c.getInt16(), a += c.pos;
                var y = new t.Controller();
                this._controllers.push(y), y.parent = this, y.setup(c), c.pos = a;
            }
            c.seek(0, 2);
            var m = c.getInt16();
            for (s = 0; s < m; s++) {
                if (h = c.getInt16(), r = c.pos, e) p = e[i + s]; else {
                    c.seek(r, 0);
                    var v, w = c.readByte(), C = c.readS(), b = c.readS(), S = null;
                    if (null != C) S = (v = null != b ? t.UIPackage.getById(b) : d.owner) ? v.getItemById(C) : null;
                    S ? (p = t.UIObjectFactory.newObject(S)).constructFromResource() : p = t.UIObjectFactory.newObject(w);
                }
                p._underConstruct = !0, p.setup_beforeAdd(c, r), p.parent = this, this._children.push(p), 
                c.pos = r + h;
            }
            for (c.seek(0, 3), this.relations.setup(c, !0), c.seek(0, 2), c.skip(2), s = 0; s < m; s++) a = c.getInt16(), 
            a += c.pos, c.seek(c.pos, 3), this._children[s].relations.setup(c, !1), c.pos = a;
            for (c.seek(0, 2), c.skip(2), s = 0; s < m; s++) a = c.getInt16(), a += c.pos, (p = this._children[s]).setup_afterAdd(c, c.pos), 
            p._underConstruct = !1, c.pos = a;
            c.seek(0, 4), c.skip(2), this.opaque = c.readBool();
            var x = c.getInt16();
            -1 != x && this.setMask(this.getChildAt(x).displayObject, c.readBool());
            var I, T = c.readS();
            l = c.getInt32(), _ = c.getInt32(), T ? (S = d.owner.getItemById(T)) && S.pixelHitTestData && (I = new t.PixelHitTest(S.pixelHitTestData, l, _)) : 0 != l && -1 != _ && (I = new t.ChildHitArea(this.getChildAt(_).displayObject)), 
            I && (this._displayObject.hitArea = I, this._displayObject.mouseThrough = !1, this._displayObject.hitTestPrior = !0), 
            c.seek(0, 5);
            var P = c.getInt16();
            for (s = 0; s < P; s++) {
                a = c.getInt16(), a += c.pos;
                var L = new t.Transition(this);
                L.setup(c), this._transitions.push(L), c.pos = a;
            }
            this._transitions.length > 0 && (this.displayObject.on(Laya.Event.DISPLAY, this, this.___added), 
            this.displayObject.on(Laya.Event.UNDISPLAY, this, this.___removed)), this.applyAllControllers(), 
            this._buildingDisplayList = !1, this._underConstruct = !1, this.buildNativeDisplayList(), 
            this.setBoundsChangedFlag(), d.objectType != t.ObjectType.Component && this.constructExtension(c), 
            this.onConstruct();
        }
        constructExtension(t) {}
        onConstruct() {
            this.constructFromXML(null);
        }
        constructFromXML(t) {}
        setup_afterAdd(t, e) {
            super.setup_afterAdd(t, e), t.seek(e, 4);
            var i, s, h = t.getInt16();
            for (-1 != h && this._scrollPane && (this._scrollPane.pageController = this._parent.getControllerAt(h)), 
            i = t.getInt16(), s = 0; s < i; s++) {
                var r = this.getController(t.readS()), a = t.readS();
                r && (r.selectedPageId = a);
            }
            if (t.version >= 2) for (i = t.getInt16(), s = 0; s < i; s++) {
                var n = t.readS(), o = t.getInt16(), l = t.readS(), _ = this.getChildByPath(n);
                _ && _.setProp(o, l);
            }
        }
        ___added() {
            for (var t = this._transitions.length, e = 0; e < t; ++e) this._transitions[e].onOwnerAddedToStage();
        }
        ___removed() {
            for (var t = this._transitions.length, e = 0; e < t; ++e) this._transitions[e].onOwnerRemovedFromStage();
        }
    }
    t.GComponent = e;
}(fgui), function(t) {
    class e extends t.GComponent {
        constructor() {
            super(), this._soundVolumeScale = 0, this._downEffect = 0, this._mode = t.ButtonMode.Common, 
            this._title = "", this._icon = "", this._sound = t.UIConfig.buttonSound, this._soundVolumeScale = t.UIConfig.buttonSoundVolumeScale, 
            this._changeStateOnClick = !0, this._downEffectValue = .8;
        }
        get icon() {
            return this._icon;
        }
        set icon(t) {
            this._icon = t, t = this._selected && this._selectedIcon ? this._selectedIcon : this._icon, 
            this._iconObject && (this._iconObject.icon = t), this.updateGear(7);
        }
        get selectedIcon() {
            return this._selectedIcon;
        }
        set selectedIcon(t) {
            this._selectedIcon = t, t = this._selected && this._selectedIcon ? this._selectedIcon : this._icon, 
            this._iconObject && (this._iconObject.icon = t);
        }
        get title() {
            return this._title;
        }
        set title(t) {
            this._title = t, this._titleObject && (this._titleObject.text = this._selected && this._selectedTitle ? this._selectedTitle : this._title), 
            this.updateGear(6);
        }
        get text() {
            return this.title;
        }
        set text(t) {
            this.title = t;
        }
        get selectedTitle() {
            return this._selectedTitle;
        }
        set selectedTitle(t) {
            this._selectedTitle = t, this._titleObject && (this._titleObject.text = this._selected && this._selectedTitle ? this._selectedTitle : this._title);
        }
        get titleColor() {
            var t = this.getTextField();
            return t ? t.color : "#000000";
        }
        set titleColor(t) {
            var e = this.getTextField();
            e && (e.color = t), this.updateGear(4);
        }
        get titleFontSize() {
            var t = this.getTextField();
            return t ? t.fontSize : 0;
        }
        set titleFontSize(t) {
            var e = this.getTextField();
            e && (e.fontSize = t);
        }
        get sound() {
            return this._sound;
        }
        set sound(t) {
            this._sound = t;
        }
        get soundVolumeScale() {
            return this._soundVolumeScale;
        }
        set soundVolumeScale(t) {
            this._soundVolumeScale = t;
        }
        set selected(i) {
            if (this._mode != t.ButtonMode.Common && this._selected != i) {
                if (this._selected = i, this.grayed && this._buttonController && this._buttonController.hasPage(e.DISABLED) ? this._selected ? this.setState(e.SELECTED_DISABLED) : this.setState(e.DISABLED) : this._selected ? this.setState(this._over ? e.SELECTED_OVER : e.DOWN) : this.setState(this._over ? e.OVER : e.UP), 
                this._selectedTitle && this._titleObject && (this._titleObject.text = this._selected ? this._selectedTitle : this._title), 
                this._selectedIcon) {
                    var s = this._selected ? this._selectedIcon : this._icon;
                    this._iconObject && (this._iconObject.icon = s);
                }
                this._relatedController && this._parent && !this._parent._buildingDisplayList && (this._selected ? (this._relatedController.selectedPageId = this._relatedPageId, 
                this._relatedController.autoRadioGroupDepth && this._parent.adjustRadioGroupDepth(this, this._relatedController)) : this._mode == t.ButtonMode.Check && this._relatedController.selectedPageId == this._relatedPageId && (this._relatedController.oppositePageId = this._relatedPageId));
            }
        }
        get selected() {
            return this._selected;
        }
        get mode() {
            return this._mode;
        }
        set mode(e) {
            this._mode != e && (e == t.ButtonMode.Common && (this.selected = !1), this._mode = e);
        }
        get relatedController() {
            return this._relatedController;
        }
        set relatedController(t) {
            t != this._relatedController && (this._relatedController = t, this._relatedPageId = null);
        }
        get relatedPageId() {
            return this._relatedPageId;
        }
        set relatedPageId(t) {
            this._relatedPageId = t;
        }
        get changeStateOnClick() {
            return this._changeStateOnClick;
        }
        set changeStateOnClick(t) {
            this._changeStateOnClick = t;
        }
        get linkedPopup() {
            return this._linkedPopup;
        }
        set linkedPopup(t) {
            this._linkedPopup = t;
        }
        getTextField() {
            return this._titleObject instanceof t.GTextField ? this._titleObject : this._titleObject instanceof t.GLabel || this._titleObject instanceof e ? this._titleObject.getTextField() : null;
        }
        fireClick(i) {
            null == i && (i = !0), i && this._mode == t.ButtonMode.Common && (this.setState(e.OVER), 
            Laya.timer.once(100, this, this.setState, [ e.DOWN ], !1), Laya.timer.once(200, this, this.setState, [ e.UP ], !1)), 
            this.__click(t.Events.createEvent(Laya.Event.CLICK, this.displayObject));
        }
        setState(i) {
            if (this._buttonController && (this._buttonController.selectedPage = i), 1 == this._downEffect) {
                var s = this.numChildren;
                if (i == e.DOWN || i == e.SELECTED_OVER || i == e.SELECTED_DISABLED) for (var h = 255 * this._downEffectValue, r = Laya.Utils.toHexColor((h << 16) + (h << 8) + h), a = 0; a < s; a++) {
                    var n = this.getChildAt(a);
                    n instanceof t.GTextField || n.setProp(t.ObjectPropID.Color, r);
                } else for (a = 0; a < s; a++) (n = this.getChildAt(a)) instanceof t.GTextField || n.setProp(t.ObjectPropID.Color, "#FFFFFF");
            } else 2 == this._downEffect && (i == e.DOWN || i == e.SELECTED_OVER || i == e.SELECTED_DISABLED ? this._downScaled || (this.setScale(this.scaleX * this._downEffectValue, this.scaleY * this._downEffectValue), 
            this._downScaled = !0) : this._downScaled && (this.setScale(this.scaleX / this._downEffectValue, this.scaleY / this._downEffectValue), 
            this._downScaled = !1));
        }
        handleControllerChanged(t) {
            super.handleControllerChanged(t), this._relatedController == t && (this.selected = this._relatedPageId == t.selectedPageId);
        }
        handleGrayedChanged() {
            this._buttonController && this._buttonController.hasPage(e.DISABLED) ? this.grayed ? this._selected && this._buttonController.hasPage(e.SELECTED_DISABLED) ? this.setState(e.SELECTED_DISABLED) : this.setState(e.DISABLED) : this._selected ? this.setState(e.DOWN) : this.setState(e.UP) : super.handleGrayedChanged();
        }
        getProp(e) {
            switch (e) {
              case t.ObjectPropID.Color:
                return this.titleColor;

              case t.ObjectPropID.OutlineColor:
                var i = this.getTextField();
                return i ? i.strokeColor : 0;

              case t.ObjectPropID.FontSize:
                return this.titleFontSize;

              case t.ObjectPropID.Selected:
                return this.selected;

              default:
                return super.getProp(e);
            }
        }
        setProp(e, i) {
            switch (e) {
              case t.ObjectPropID.Color:
                this.titleColor = i;
                break;

              case t.ObjectPropID.OutlineColor:
                var s = this.getTextField();
                s && (s.strokeColor = i);
                break;

              case t.ObjectPropID.FontSize:
                this.titleFontSize = i;
                break;

              case t.ObjectPropID.Selected:
                this.selected = i;
                break;

              default:
                super.setProp(e, i);
            }
        }
        constructExtension(i) {
            i.seek(0, 6), this._mode = i.readByte();
            var s = i.readS();
            s && (this._sound = s), this._soundVolumeScale = i.getFloat32(), this._downEffect = i.readByte(), 
            this._downEffectValue = i.getFloat32(), 2 == this._downEffect && this.setPivot(.5, .5, this.pivotAsAnchor), 
            this._buttonController = this.getController("button"), this._titleObject = this.getChild("title"), 
            this._iconObject = this.getChild("icon"), this._titleObject && (this._title = this._titleObject.text), 
            this._iconObject && (this._icon = this._iconObject.icon), this._mode == t.ButtonMode.Common && this.setState(e.UP), 
            this.on(Laya.Event.ROLL_OVER, this, this.__rollover), this.on(Laya.Event.ROLL_OUT, this, this.__rollout), 
            this.on(Laya.Event.MOUSE_DOWN, this, this.__mousedown), this.on(Laya.Event.CLICK, this, this.__click);
        }
        setup_afterAdd(t, e) {
            var i, s;
            (super.setup_afterAdd(t, e), t.seek(e, 6)) && (t.readByte() == this.packageItem.objectType && (null != (i = t.readS()) && (this.title = i), 
            null != (i = t.readS()) && (this.selectedTitle = i), null != (i = t.readS()) && (this.icon = i), 
            null != (i = t.readS()) && (this.selectedIcon = i), t.readBool() && (this.titleColor = t.readColorS()), 
            0 != (s = t.getInt32()) && (this.titleFontSize = s), (s = t.getInt16()) >= 0 && (this._relatedController = this.parent.getControllerAt(s)), 
            this._relatedPageId = t.readS(), null != (i = t.readS()) && (this._sound = i), t.readBool() && (this._soundVolumeScale = t.getFloat32()), 
            this.selected = t.readBool()));
        }
        __rollover() {
            this._buttonController && this._buttonController.hasPage(e.OVER) && (this._over = !0, 
            this._down || this.grayed && this._buttonController.hasPage(e.DISABLED) || this.setState(this._selected ? e.SELECTED_OVER : e.OVER));
        }
        __rollout() {
            this._buttonController && this._buttonController.hasPage(e.OVER) && (this._over = !1, 
            this._down || this.grayed && this._buttonController.hasPage(e.DISABLED) || this.setState(this._selected ? e.DOWN : e.UP));
        }
        __mousedown(i) {
            this._down = !0, t.GRoot.inst.checkPopups(i.target), Laya.stage.on(Laya.Event.MOUSE_UP, this, this.__mouseup), 
            this._mode == t.ButtonMode.Common && (this.grayed && this._buttonController && this._buttonController.hasPage(e.DISABLED) ? this.setState(e.SELECTED_DISABLED) : this.setState(e.DOWN)), 
            this._linkedPopup && (this._linkedPopup instanceof t.Window ? this._linkedPopup.toggleStatus() : this.root.togglePopup(this._linkedPopup, this));
        }
        __mouseup() {
            if (this._down) {
                if (Laya.stage.off(Laya.Event.MOUSE_UP, this, this.__mouseup), this._down = !1, 
                null == this._displayObject) return;
                this._mode == t.ButtonMode.Common && (this.grayed && this._buttonController && this._buttonController.hasPage(e.DISABLED) ? this.setState(e.DISABLED) : this._over ? this.setState(e.OVER) : this.setState(e.UP));
            }
        }
        __click(e) {
            if (this._sound) {
                var i = t.UIPackage.getItemByURL(this._sound);
                i ? t.GRoot.inst.playOneShotSound(i.file) : t.GRoot.inst.playOneShotSound(this._sound);
            }
            this._mode == t.ButtonMode.Check ? this._changeStateOnClick && (this.selected = !this._selected, 
            t.Events.dispatch(t.Events.STATE_CHANGED, this.displayObject, e)) : this._mode == t.ButtonMode.Radio ? this._changeStateOnClick && !this._selected && (this.selected = !0, 
            t.Events.dispatch(t.Events.STATE_CHANGED, this.displayObject, e)) : this._relatedController && (this._relatedController.selectedPageId = this._relatedPageId);
        }
    }
    e.UP = "up", e.DOWN = "down", e.OVER = "over", e.SELECTED_OVER = "selectedOver", 
    e.DISABLED = "disabled", e.SELECTED_DISABLED = "selectedDisabled", t.GButton = e;
}(fgui), function(t) {
    t.GComboBox = class extends t.GComponent {
        constructor() {
            super(), this._visibleItemCount = t.UIConfig.defaultComboBoxVisibleItemCount, this._itemsUpdated = !0, 
            this._selectedIndex = -1, this._popupDirection = 0, this._items = [], this._values = [];
        }
        get text() {
            return this._titleObject ? this._titleObject.text : null;
        }
        set text(t) {
            this._titleObject && (this._titleObject.text = t), this.updateGear(6);
        }
        get titleColor() {
            var t = this.getTextField();
            return t ? t.color : "#000000";
        }
        set titleColor(t) {
            var e = this.getTextField();
            e && (e.color = t), this.updateGear(4);
        }
        get titleFontSize() {
            var t = this.getTextField();
            return t ? t.fontSize : 0;
        }
        set titleFontSize(t) {
            var e = this.getTextField();
            e && (e.fontSize = t);
        }
        get icon() {
            return this._iconObject ? this._iconObject.icon : null;
        }
        set icon(t) {
            this._iconObject && (this._iconObject.icon = t), this.updateGear(7);
        }
        get visibleItemCount() {
            return this._visibleItemCount;
        }
        set visibleItemCount(t) {
            this._visibleItemCount = t;
        }
        get popupDirection() {
            return this._popupDirection;
        }
        set popupDirection(t) {
            this._popupDirection = t;
        }
        get items() {
            return this._items;
        }
        set items(t) {
            t ? this._items = t.concat() : this._items.length = 0, this._items.length > 0 ? (this._selectedIndex >= this._items.length ? this._selectedIndex = this._items.length - 1 : -1 == this._selectedIndex && (this._selectedIndex = 0), 
            this.text = this._items[this._selectedIndex], this._icons && this._selectedIndex < this._icons.length && (this.icon = this._icons[this._selectedIndex])) : (this.text = "", 
            this._icons && (this.icon = null), this._selectedIndex = -1), this._itemsUpdated = !0;
        }
        get icons() {
            return this._icons;
        }
        set icons(t) {
            this._icons = t, this._icons && -1 != this._selectedIndex && this._selectedIndex < this._icons.length && (this.icon = this._icons[this._selectedIndex]);
        }
        get values() {
            return this._values;
        }
        set values(t) {
            t ? this._values = t.concat() : this._values.length = 0;
        }
        get selectedIndex() {
            return this._selectedIndex;
        }
        set selectedIndex(t) {
            this._selectedIndex != t && (this._selectedIndex = t, this._selectedIndex >= 0 && this._selectedIndex < this._items.length ? (this.text = this._items[this._selectedIndex], 
            this._icons && this._selectedIndex < this._icons.length && (this.icon = this._icons[this._selectedIndex])) : (this.text = "", 
            this._icons && (this.icon = null)), this.updateSelectionController());
        }
        get value() {
            return this._values[this._selectedIndex];
        }
        set value(t) {
            var e = this._values.indexOf(t);
            -1 == e && null == t && (e = this._values.indexOf("")), this.selectedIndex = e;
        }
        getTextField() {
            return this._titleObject instanceof t.GTextField ? this._titleObject : this._titleObject instanceof t.GLabel || this._titleObject instanceof t.GButton ? this._titleObject.getTextField() : null;
        }
        setState(t) {
            this._buttonController && (this._buttonController.selectedPage = t);
        }
        get selectionController() {
            return this._selectionController;
        }
        set selectionController(t) {
            this._selectionController = t;
        }
        handleControllerChanged(t) {
            super.handleControllerChanged(t), this._selectionController == t && (this.selectedIndex = t.selectedIndex);
        }
        updateSelectionController() {
            if (this._selectionController && !this._selectionController.changing && this._selectedIndex < this._selectionController.pageCount) {
                var t = this._selectionController;
                this._selectionController = null, t.selectedIndex = this._selectedIndex, this._selectionController = t;
            }
        }
        dispose() {
            this.dropdown && (this.dropdown.dispose(), this.dropdown = null), this._selectionController = null, 
            super.dispose();
        }
        getProp(e) {
            switch (e) {
              case t.ObjectPropID.Color:
                return this.titleColor;

              case t.ObjectPropID.OutlineColor:
                var i = this.getTextField();
                return i ? i.strokeColor : 0;

              case t.ObjectPropID.FontSize:
                return (i = this.getTextField()) ? i.fontSize : 0;

              default:
                return super.getProp(e);
            }
        }
        setProp(e, i) {
            switch (e) {
              case t.ObjectPropID.Color:
                this.titleColor = i;
                break;

              case t.ObjectPropID.OutlineColor:
                var s = this.getTextField();
                s && (s.strokeColor = i);
                break;

              case t.ObjectPropID.FontSize:
                (s = this.getTextField()) && (s.fontSize = i);
                break;

              default:
                super.setProp(e, i);
            }
        }
        constructExtension(e) {
            var i;
            if (this._buttonController = this.getController("button"), this._titleObject = this.getChild("title"), 
            this._iconObject = this.getChild("icon"), i = e.readS()) {
                if (this.dropdown = t.UIPackage.createObjectFromURL(i), !this.dropdown) return void Laya.Log.print("下拉框必须为元件");
                if (this.dropdown.name = "this._dropdownObject", this._list = this.dropdown.getChild("list"), 
                !this._list) return void Laya.Log.print(this.resourceURL + ": 下拉框的弹出元件里必须包含名为list的列表");
                this._list.on(t.Events.CLICK_ITEM, this, this.__clickItem), this._list.addRelation(this.dropdown, t.RelationType.Width), 
                this._list.removeRelation(this.dropdown, t.RelationType.Height), this.dropdown.addRelation(this._list, t.RelationType.Height), 
                this.dropdown.removeRelation(this._list, t.RelationType.Width), this.dropdown.displayObject.on(Laya.Event.UNDISPLAY, this, this.__popupWinClosed);
            }
            this.on(Laya.Event.ROLL_OVER, this, this.__rollover), this.on(Laya.Event.ROLL_OUT, this, this.__rollout), 
            this.on(Laya.Event.MOUSE_DOWN, this, this.__mousedown);
        }
        setup_afterAdd(t, e) {
            if (super.setup_afterAdd(t, e), t.seek(e, 6) && t.readByte() == this.packageItem.objectType) {
                var i, s, h, r, a = t.getInt16();
                for (i = 0; i < a; i++) h = t.getInt16(), h += t.pos, this._items[i] = t.readS(), 
                this._values[i] = t.readS(), null != (r = t.readS()) && (this._icons || (this._icons = []), 
                this._icons[i] = r), t.pos = h;
                null != (r = t.readS()) ? (this.text = r, this._selectedIndex = this._items.indexOf(r)) : this._items.length > 0 ? (this._selectedIndex = 0, 
                this.text = this._items[0]) : this._selectedIndex = -1, null != (r = t.readS()) && (this.icon = r), 
                t.readBool() && (this.titleColor = t.readColorS()), (s = t.getInt32()) > 0 && (this._visibleItemCount = s), 
                this._popupDirection = t.readByte(), (s = t.getInt16()) >= 0 && (this._selectionController = this.parent.getControllerAt(s));
            }
        }
        showDropdown() {
            if (this._itemsUpdated) {
                this._itemsUpdated = !1, this._list.removeChildrenToPool();
                for (var e = this._items.length, i = 0; i < e; i++) {
                    var s = this._list.addItemFromPool();
                    s.name = i < this._values.length ? this._values[i] : "", s.text = this._items[i], 
                    s.icon = this._icons && i < this._icons.length ? this._icons[i] : null;
                }
                this._list.resizeToFit(this._visibleItemCount);
            }
            this._list.selectedIndex = -1, this.dropdown.width = this.width, this._list.ensureBoundsCorrect();
            var h = null;
            this._popupDirection == t.PopupDirection.Down ? h = !0 : this._popupDirection == t.PopupDirection.Up && (h = !1), 
            this.root.togglePopup(this.dropdown, this, h), this.dropdown.parent && this.setState(t.GButton.DOWN);
        }
        __popupWinClosed() {
            this._over ? this.setState(t.GButton.OVER) : this.setState(t.GButton.UP);
        }
        __clickItem(t, e) {
            Laya.timer.callLater(this, this.__clickItem2, [ this._list.getChildIndex(t), e ]);
        }
        __clickItem2(e, i) {
            this.dropdown.parent instanceof t.GRoot && this.dropdown.parent.hidePopup(), this._selectedIndex = -1, 
            this.selectedIndex = e, t.Events.dispatch(t.Events.STATE_CHANGED, this.displayObject, i);
        }
        __rollover() {
            this._over = !0, this._down || this.dropdown && this.dropdown.parent || this.setState(t.GButton.OVER);
        }
        __rollout() {
            this._over = !1, this._down || this.dropdown && this.dropdown.parent || this.setState(t.GButton.UP);
        }
        __mousedown(e) {
            e.target instanceof Laya.Input || (this._down = !0, t.GRoot.inst.checkPopups(e.target), 
            Laya.stage.on(Laya.Event.MOUSE_UP, this, this.__mouseup), this.dropdown && this.showDropdown());
        }
        __mouseup() {
            this._down && (this._down = !1, Laya.stage.off(Laya.Event.MOUSE_UP, this, this.__mouseup), 
            this.dropdown && !this.dropdown.parent && (this._over ? this.setState(t.GButton.OVER) : this.setState(t.GButton.UP)));
        }
    };
}(fgui), function(t) {
    t.GGraph = class extends t.GObject {
        constructor() {
            super(), this._type = 0, this._lineSize = 1, this._lineColor = "#000000", this._fillColor = "#FFFFFF";
        }
        drawRect(t, e, i, s) {
            this._type = 1, this._lineSize = t, this._lineColor = e, this._fillColor = i, this._cornerRadius = s, 
            this.updateGraph();
        }
        drawEllipse(t, e, i) {
            this._type = 2, this._lineSize = t, this._lineColor = e, this._fillColor = i, this.updateGraph();
        }
        drawRegularPolygon(t, e, i, s, h, r) {
            this._type = 4, this._lineSize = t, this._lineColor = e, this._fillColor = i, this._sides = s, 
            this._startAngle = h || 0, this._distances = r, this.updateGraph();
        }
        drawPolygon(t, e, i, s) {
            this._type = 3, this._lineSize = t, this._lineColor = e, this._fillColor = i, this._polygonPoints = s, 
            this.updateGraph();
        }
        get distances() {
            return this._distances;
        }
        set distances(t) {
            this._distances = t, 3 == this._type && this.updateGraph();
        }
        get color() {
            return this._fillColor;
        }
        set color(t) {
            this._fillColor = t, this.updateGear(4), 0 != this._type && this.updateGraph();
        }
        updateGraph() {
            this._displayObject.mouseEnabled = this.touchable;
            var e = this._displayObject.graphics;
            e.clear();
            var i = this.width, s = this.height;
            if (0 != i && 0 != s) {
                var h = this._fillColor, r = this._lineColor;
                if (t.ToolSet.startsWith(h, "rgba")) {
                    var a = h.substring(5, h.lastIndexOf(")")).split(","), n = parseFloat(a[3]);
                    0 == n ? h = null : (h = Laya.Utils.toHexColor((parseInt(a[0]) << 16) + (parseInt(a[1]) << 8) + parseInt(a[2])), 
                    this.alpha = n);
                }
                if (1 == this._type) if (this._cornerRadius) {
                    var o = [ [ "moveTo", this._cornerRadius[0], 0 ], [ "lineTo", i - this._cornerRadius[1], 0 ], [ "arcTo", i, 0, i, this._cornerRadius[1], this._cornerRadius[1] ], [ "lineTo", i, s - this._cornerRadius[3] ], [ "arcTo", i, s, i - this._cornerRadius[3], s, this._cornerRadius[3] ], [ "lineTo", this._cornerRadius[2], s ], [ "arcTo", 0, s, 0, s - this._cornerRadius[2], this._cornerRadius[2] ], [ "lineTo", 0, this._cornerRadius[0] ], [ "arcTo", 0, 0, this._cornerRadius[0], 0, this._cornerRadius[0] ], [ "closePath" ] ];
                    e.drawPath(0, 0, o, h ? {
                        fillStyle: h
                    } : null, this._lineSize > 0 ? {
                        strokeStyle: r,
                        lineWidth: this._lineSize
                    } : null);
                } else e.drawRect(0, 0, i, s, h, this._lineSize > 0 ? r : null, this._lineSize); else if (2 == this._type) e.drawCircle(i / 2, s / 2, i / 2, h, this._lineSize > 0 ? r : null, this._lineSize); else if (3 == this._type) e.drawPoly(0, 0, this._polygonPoints, h, this._lineSize > 0 ? r : null, this._lineSize); else if (4 == this._type) {
                    this._polygonPoints || (this._polygonPoints = []);
                    var l = Math.min(this._width, this._height) / 2;
                    this._polygonPoints.length = 0;
                    for (var _, d = Laya.Utils.toRadian(this._startAngle), c = 2 * Math.PI / this._sides, u = 0; u < this._sides; u++) {
                        this._distances ? (_ = this._distances[u], isNaN(_) && (_ = 1)) : _ = 1;
                        var g = l + l * _ * Math.cos(d), p = l + l * _ * Math.sin(d);
                        this._polygonPoints.push(g, p), d += c;
                    }
                    e.drawPoly(0, 0, this._polygonPoints, h, this._lineSize > 0 ? r : null, this._lineSize);
                }
                this._displayObject.repaint();
            }
        }
        replaceMe(t) {
            if (!this._parent) throw "parent not set";
            t.name = this.name, t.alpha = this.alpha, t.rotation = this.rotation, t.visible = this.visible, 
            t.touchable = this.touchable, t.grayed = this.grayed, t.setXY(this.x, this.y), t.setSize(this.width, this.height);
            var e = this._parent.getChildIndex(this);
            this._parent.addChildAt(t, e), t.relations.copyFrom(this.relations), this._parent.removeChild(this, !0);
        }
        addBeforeMe(t) {
            if (!this._parent) throw "parent not set";
            var e = this._parent.getChildIndex(this);
            this._parent.addChildAt(t, e);
        }
        addAfterMe(t) {
            if (!this._parent) throw "parent not set";
            var e = this._parent.getChildIndex(this);
            e++, this._parent.addChildAt(t, e);
        }
        setNativeObject(t) {
            this._type = 0, this._displayObject.mouseEnabled = this.touchable, this._displayObject.graphics.clear(), 
            this._displayObject.addChild(t);
        }
        createDisplayObject() {
            super.createDisplayObject(), this._displayObject.mouseEnabled = !1, this._hitArea = new Laya.HitArea(), 
            this._hitArea.hit = this._displayObject.graphics, this._displayObject.hitArea = this._hitArea;
        }
        getProp(e) {
            return e == t.ObjectPropID.Color ? this.color : super.getProp(e);
        }
        setProp(e, i) {
            e == t.ObjectPropID.Color ? this.color = i : super.setProp(e, i);
        }
        handleSizeChanged() {
            super.handleSizeChanged(), 0 != this._type && this.updateGraph();
        }
        setup_beforeAdd(t, e) {
            if (super.setup_beforeAdd(t, e), t.seek(e, 5), this._type = t.readByte(), 0 != this._type) {
                var i, s;
                if (this._lineSize = t.getInt32(), this._lineColor = t.readColorS(!0), this._fillColor = t.readColorS(!0), 
                t.readBool()) for (this._cornerRadius = [], i = 0; i < 4; i++) this._cornerRadius[i] = t.getFloat32();
                if (3 == this._type) for (s = t.getInt16(), this._polygonPoints = [], this._polygonPoints.length = s, 
                i = 0; i < s; i++) this._polygonPoints[i] = t.getFloat32(); else if (4 == this._type && (this._sides = t.getInt16(), 
                this._startAngle = t.getFloat32(), (s = t.getInt16()) > 0)) for (this._distances = [], 
                i = 0; i < s; i++) this._distances[i] = t.getFloat32();
                this.updateGraph();
            }
        }
    };
}(fgui), function(t) {
    t.GGroup = class extends t.GObject {
        constructor() {
            super(), this._layout = 0, this._lineGap = 0, this._columnGap = 0, this._mainGridIndex = -1, 
            this._mainGridMinSize = 50, this._mainChildIndex = -1, this._totalSize = 0, this._numChildren = 0, 
            this._updating = 0;
        }
        dispose() {
            this._boundsChanged = !1, super.dispose();
        }
        get layout() {
            return this._layout;
        }
        set layout(t) {
            this._layout != t && (this._layout = t, this.setBoundsChangedFlag());
        }
        get lineGap() {
            return this._lineGap;
        }
        set lineGap(t) {
            this._lineGap != t && (this._lineGap = t, this.setBoundsChangedFlag(!0));
        }
        get columnGap() {
            return this._columnGap;
        }
        set columnGap(t) {
            this._columnGap != t && (this._columnGap = t, this.setBoundsChangedFlag(!0));
        }
        get excludeInvisibles() {
            return this._excludeInvisibles;
        }
        set excludeInvisibles(t) {
            this._excludeInvisibles != t && (this._excludeInvisibles = t, this.setBoundsChangedFlag());
        }
        get autoSizeDisabled() {
            return this._autoSizeDisabled;
        }
        set autoSizeDisabled(t) {
            this._autoSizeDisabled = t;
        }
        get mainGridMinSize() {
            return this._mainGridMinSize;
        }
        set mainGridMinSize(t) {
            this._mainGridMinSize != t && (this._mainGridMinSize = t, this.setBoundsChangedFlag());
        }
        get mainGridIndex() {
            return this._mainGridIndex;
        }
        set mainGridIndex(t) {
            this._mainGridIndex != t && (this._mainGridIndex = t, this.setBoundsChangedFlag());
        }
        setBoundsChangedFlag(e) {
            0 == this._updating && this._parent && (e || (this._percentReady = !1), this._boundsChanged || (this._boundsChanged = !0, 
            this._layout != t.GroupLayoutType.None && Laya.timer.callLater(this, this.ensureBoundsCorrect)));
        }
        ensureSizeCorrect() {
            this._parent && this._boundsChanged && 0 != this._layout && (this._boundsChanged = !1, 
            this._autoSizeDisabled ? this.resizeChildren(0, 0) : (this.handleLayout(), this.updateBounds()));
        }
        ensureBoundsCorrect() {
            this._parent && this._boundsChanged && (this._boundsChanged = !1, 0 == this._layout ? this.updateBounds() : this._autoSizeDisabled ? this.resizeChildren(0, 0) : (this.handleLayout(), 
            this.updateBounds()));
        }
        updateBounds() {
            Laya.timer.clear(this, this.ensureBoundsCorrect);
            var t, e, i, s = this._parent.numChildren, h = Number.POSITIVE_INFINITY, r = Number.POSITIVE_INFINITY, a = Number.NEGATIVE_INFINITY, n = Number.NEGATIVE_INFINITY, o = !0;
            for (t = 0; t < s; t++) (e = this._parent.getChildAt(t)).group != this || this._excludeInvisibles && !e.internalVisible3 || ((i = e.xMin) < h && (h = i), 
            (i = e.yMin) < r && (r = i), (i = e.xMin + e.width) > a && (a = i), (i = e.yMin + e.height) > n && (n = i), 
            o = !1);
            var l = 0, _ = 0;
            o || (this._updating |= 1, this.setXY(h, r), this._updating &= 2, l = a - h, _ = n - r), 
            0 == (2 & this._updating) ? (this._updating |= 2, this.setSize(l, _), this._updating &= 1) : (this._updating &= 1, 
            this.resizeChildren(this._width - l, this._height - _));
        }
        handleLayout() {
            var e, i, s;
            if (this._updating |= 1, this._layout == t.GroupLayoutType.Horizontal) {
                var h = this.x;
                for (s = this._parent.numChildren, i = 0; i < s; i++) (e = this._parent.getChildAt(i)).group == this && (this._excludeInvisibles && !e.internalVisible3 || (e.xMin = h, 
                0 != e.width && (h += e.width + this._columnGap)));
            } else if (this._layout == t.GroupLayoutType.Vertical) {
                var r = this.y;
                for (s = this._parent.numChildren, i = 0; i < s; i++) (e = this._parent.getChildAt(i)).group == this && (this._excludeInvisibles && !e.internalVisible3 || (e.yMin = r, 
                0 != e.height && (r += e.height + this._lineGap)));
            }
            this._updating &= 2;
        }
        moveChildren(t, e) {
            if (0 == (1 & this._updating) && this._parent) {
                this._updating |= 1;
                var i, s, h = this._parent.numChildren;
                for (i = 0; i < h; i++) (s = this._parent.getChildAt(i)).group == this && s.setXY(s.x + t, s.y + e);
                this._updating &= 2;
            }
        }
        resizeChildren(e, i) {
            if (this._layout != t.GroupLayoutType.None && 0 == (2 & this._updating) && this._parent) if (this._updating |= 2, 
            !this._boundsChanged || (this._boundsChanged = !1, this._autoSizeDisabled)) {
                var s, h, r = this._parent.numChildren;
                if (!this._percentReady) {
                    this._percentReady = !0, this._numChildren = 0, this._totalSize = 0, this._mainChildIndex = -1;
                    var a = 0;
                    for (s = 0; s < r; s++) (h = this._parent.getChildAt(s)).group == this && (this._excludeInvisibles && !h.internalVisible3 || (a == this._mainGridIndex && (this._mainChildIndex = s), 
                    this._numChildren++, 1 == this._layout ? this._totalSize += h.width : this._totalSize += h.height), 
                    a++);
                    for (-1 != this._mainChildIndex && (1 == this._layout ? (h = this._parent.getChildAt(this._mainChildIndex), 
                    this._totalSize += this._mainGridMinSize - h.width, h._sizePercentInGroup = this._mainGridMinSize / this._totalSize) : (h = this._parent.getChildAt(this._mainChildIndex), 
                    this._totalSize += this._mainGridMinSize - h.height, h._sizePercentInGroup = this._mainGridMinSize / this._totalSize)), 
                    s = 0; s < r; s++) (h = this._parent.getChildAt(s)).group == this && s != this._mainChildIndex && (this._totalSize > 0 ? h._sizePercentInGroup = (1 == this._layout ? h.width : h.height) / this._totalSize : h._sizePercentInGroup = 0);
                }
                var n = 0, o = 1, l = !1;
                if (1 == this._layout) {
                    n = this.width - (this._numChildren - 1) * this._columnGap, -1 != this._mainChildIndex && n >= this._totalSize && ((h = this._parent.getChildAt(this._mainChildIndex)).setSize(n - (this._totalSize - this._mainGridMinSize), h._rawHeight + i, !0), 
                    n -= h.width, o -= h._sizePercentInGroup, l = !0);
                    var _ = this.x;
                    for (s = 0; s < r; s++) (h = this._parent.getChildAt(s)).group == this && (!this._excludeInvisibles || h.internalVisible3 ? (l && s == this._mainChildIndex || (h.setSize(Math.round(h._sizePercentInGroup / o * n), h._rawHeight + i, !0), 
                    o -= h._sizePercentInGroup, n -= h.width), h.xMin = _, 0 != h.width && (_ += h.width + this._columnGap)) : h.setSize(h._rawWidth, h._rawHeight + i, !0));
                } else {
                    n = this.height - (this._numChildren - 1) * this._lineGap, -1 != this._mainChildIndex && n >= this._totalSize && ((h = this._parent.getChildAt(this._mainChildIndex)).setSize(h._rawWidth + e, n - (this._totalSize - this._mainGridMinSize), !0), 
                    n -= h.height, o -= h._sizePercentInGroup, l = !0);
                    var d = this.y;
                    for (s = 0; s < r; s++) (h = this._parent.getChildAt(s)).group == this && (!this._excludeInvisibles || h.internalVisible3 ? (l && s == this._mainChildIndex || (h.setSize(h._rawWidth + e, Math.round(h._sizePercentInGroup / o * n), !0), 
                    o -= h._sizePercentInGroup, n -= h.height), h.yMin = d, 0 != h.height && (d += h.height + this._lineGap)) : h.setSize(h._rawWidth + e, h._rawHeight, !0));
                }
                this._updating &= 1;
            } else this.updateBounds();
        }
        handleAlphaChanged() {
            if (!this._underConstruct) for (var t = this._parent.numChildren, e = 0; e < t; e++) {
                var i = this._parent.getChildAt(e);
                i.group == this && (i.alpha = this.alpha);
            }
        }
        handleVisibleChanged() {
            if (this._parent) for (var t = this._parent.numChildren, e = 0; e < t; e++) {
                var i = this._parent.getChildAt(e);
                i.group == this && i.handleVisibleChanged();
            }
        }
        setup_beforeAdd(t, e) {
            super.setup_beforeAdd(t, e), t.seek(e, 5), this._layout = t.readByte(), this._lineGap = t.getInt32(), 
            this._columnGap = t.getInt32(), t.version >= 2 && (this._excludeInvisibles = t.readBool(), 
            this._autoSizeDisabled = t.readBool(), this._mainChildIndex = t.getInt16());
        }
        setup_afterAdd(t, e) {
            super.setup_afterAdd(t, e), this.visible || this.handleVisibleChanged();
        }
    };
}(fgui), function(t) {
    t.GImage = class extends t.GObject {
        constructor() {
            super(), this._flip = 0;
        }
        get image() {
            return this._image;
        }
        get color() {
            return this.image.color;
        }
        set color(t) {
            this.image.color != t && (this.image.color = t, this.updateGear(4));
        }
        get flip() {
            return this._flip;
        }
        set flip(e) {
            if (this._flip != e) {
                this._flip = e;
                var i = 1, s = 1;
                this._flip != t.FlipType.Horizontal && this._flip != t.FlipType.Both || (i = -1), 
                this._flip != t.FlipType.Vertical && this._flip != t.FlipType.Both || (s = -1), 
                this.setScale(i, s), this.handleXYChanged();
            }
        }
        get fillMethod() {
            return this.image.fillMethod;
        }
        set fillMethod(t) {
            this.image.fillMethod = t;
        }
        get fillOrigin() {
            return this.image.fillOrigin;
        }
        set fillOrigin(t) {
            this.image.fillOrigin = t;
        }
        get fillClockwise() {
            return this.image.fillClockwise;
        }
        set fillClockwise(t) {
            this.image.fillClockwise = t;
        }
        get fillAmount() {
            return this.image.fillAmount;
        }
        set fillAmount(t) {
            this.image.fillAmount = t;
        }
        createDisplayObject() {
            this._displayObject = this._image = new t.Image(), this.image.mouseEnabled = !1, 
            this._displayObject.$owner = this;
        }
        constructFromResource() {
            this._contentItem = this.packageItem.getBranch(), this.sourceWidth = this._contentItem.width, 
            this.sourceHeight = this._contentItem.height, this.initWidth = this.sourceWidth, 
            this.initHeight = this.sourceHeight, this._contentItem = this._contentItem.getHighResolution(), 
            this._contentItem.load(), this.image.scale9Grid = this._contentItem.scale9Grid, 
            this.image.scaleByTile = this._contentItem.scaleByTile, this.image.tileGridIndice = this._contentItem.tileGridIndice, 
            this.image.texture = this._contentItem.texture, this.setSize(this.sourceWidth, this.sourceHeight);
        }
        handleXYChanged() {
            super.handleXYChanged(), this._flip != t.FlipType.None && (-1 == this.scaleX && (this.image.x += this.width), 
            -1 == this.scaleY && (this.image.y += this.height));
        }
        getProp(e) {
            return e == t.ObjectPropID.Color ? this.color : super.getProp(e);
        }
        setProp(e, i) {
            e == t.ObjectPropID.Color ? this.color = i : super.setProp(e, i);
        }
        setup_beforeAdd(t, e) {
            super.setup_beforeAdd(t, e), t.seek(e, 5), t.readBool() && (this.color = t.readColorS()), 
            this.flip = t.readByte(), this.image.fillMethod = t.readByte(), 0 != this.image.fillMethod && (this.image.fillOrigin = t.readByte(), 
            this.image.fillClockwise = t.readBool(), this.image.fillAmount = t.getFloat32());
        }
    };
}(fgui), function(t) {
    class e extends t.GComponent {
        constructor() {
            super();
        }
        get icon() {
            return this._iconObject ? this._iconObject.icon : null;
        }
        set icon(t) {
            this._iconObject && (this._iconObject.icon = t), this.updateGear(7);
        }
        get title() {
            return this._titleObject ? this._titleObject.text : null;
        }
        set title(t) {
            this._titleObject && (this._titleObject.text = t), this.updateGear(6);
        }
        get text() {
            return this.title;
        }
        set text(t) {
            this.title = t;
        }
        get titleColor() {
            var t = this.getTextField();
            return t ? t.color : "#000000";
        }
        set titleColor(t) {
            var e = this.getTextField();
            e && (e.color = t), this.updateGear(4);
        }
        get titleFontSize() {
            var t = this.getTextField();
            return t ? t.fontSize : 0;
        }
        set titleFontSize(t) {
            var e = this.getTextField();
            e && (e.fontSize = t);
        }
        get color() {
            return this.titleColor;
        }
        set color(t) {
            this.titleColor = t;
        }
        set editable(t) {
            this._titleObject && (this._titleObject.asTextInput.editable = t);
        }
        get editable() {
            return this._titleObject instanceof t.GTextInput && this._titleObject.asTextInput.editable;
        }
        getTextField() {
            return this._titleObject instanceof t.GTextField ? this._titleObject : this._titleObject instanceof e || this._titleObject instanceof t.GButton ? this._titleObject.getTextField() : null;
        }
        getProp(e) {
            switch (e) {
              case t.ObjectPropID.Color:
                return this.titleColor;

              case t.ObjectPropID.OutlineColor:
                var i = this.getTextField();
                return i ? i.strokeColor : 0;

              case t.ObjectPropID.FontSize:
                return this.titleFontSize;

              default:
                return super.getProp(e);
            }
        }
        setProp(e, i) {
            switch (e) {
              case t.ObjectPropID.Color:
                this.titleColor = i;
                break;

              case t.ObjectPropID.OutlineColor:
                var s = this.getTextField();
                s && (s.strokeColor = i);
                break;

              case t.ObjectPropID.FontSize:
                this.titleFontSize = i;
                break;

              default:
                super.setProp(e, i);
            }
        }
        constructExtension(t) {
            this._titleObject = this.getChild("title"), this._iconObject = this.getChild("icon");
        }
        setup_afterAdd(e, i) {
            if (super.setup_afterAdd(e, i), e.seek(i, 6) && e.readByte() == this.packageItem.objectType) {
                var s;
                null != (s = e.readS()) && (this.title = s), null != (s = e.readS()) && (this.icon = s), 
                e.readBool() && (this.titleColor = e.readColorS());
                var h = e.getInt32();
                if (0 != h && (this.titleFontSize = h), e.readBool()) {
                    var r = this.getTextField();
                    r instanceof t.GTextInput ? (null != (s = e.readS()) && (r.promptText = s), null != (s = e.readS()) && (r.restrict = s), 
                    0 != (h = e.getInt32()) && (r.maxLength = h), 0 != (h = e.getInt32()) && (4 == h ? r.keyboardType = Laya.Input.TYPE_NUMBER : 3 == h && (r.keyboardType = Laya.Input.TYPE_URL)), 
                    e.readBool() && (r.password = !0)) : e.skip(13);
                }
            }
        }
    }
    t.GLabel = e;
}(fgui), function(t) {
    t.GList = class extends t.GComponent {
        constructor() {
            super(), this._lineCount = 0, this._columnCount = 0, this._lineGap = 0, this._columnGap = 0, 
            this._lastSelectedIndex = 0, this._numItems = 0, this._firstIndex = 0, this._curLineItemCount = 0, 
            this._virtualListChanged = 0, this.itemInfoVer = 0, this._trackBounds = !0, this._pool = new t.GObjectPool(), 
            this._layout = t.ListLayoutType.SingleColumn, this._autoResizeItem = !0, this._lastSelectedIndex = -1, 
            this._selectionMode = t.ListSelectionMode.Single, this.opaque = !0, this.scrollItemToViewOnClick = !0, 
            this._align = "left", this._verticalAlign = "top", this._container = new Laya.Sprite(), 
            this._displayObject.addChild(this._container);
        }
        dispose() {
            this._pool.clear(), super.dispose();
        }
        get layout() {
            return this._layout;
        }
        set layout(t) {
            this._layout != t && (this._layout = t, this.setBoundsChangedFlag(), this._virtual && this.setVirtualListChangedFlag(!0));
        }
        get lineCount() {
            return this._lineCount;
        }
        set lineCount(e) {
            this._lineCount != e && (this._lineCount = e, this._layout != t.ListLayoutType.FlowVertical && this._layout != t.ListLayoutType.Pagination || (this.setBoundsChangedFlag(), 
            this._virtual && this.setVirtualListChangedFlag(!0)));
        }
        get columnCount() {
            return this._columnCount;
        }
        set columnCount(e) {
            this._columnCount != e && (this._columnCount = e, this._layout != t.ListLayoutType.FlowHorizontal && this._layout != t.ListLayoutType.Pagination || (this.setBoundsChangedFlag(), 
            this._virtual && this.setVirtualListChangedFlag(!0)));
        }
        get lineGap() {
            return this._lineGap;
        }
        set lineGap(t) {
            this._lineGap != t && (this._lineGap = t, this.setBoundsChangedFlag(), this._virtual && this.setVirtualListChangedFlag(!0));
        }
        get columnGap() {
            return this._columnGap;
        }
        set columnGap(t) {
            this._columnGap != t && (this._columnGap = t, this.setBoundsChangedFlag(), this._virtual && this.setVirtualListChangedFlag(!0));
        }
        get align() {
            return this._align;
        }
        set align(t) {
            this._align != t && (this._align = t, this.setBoundsChangedFlag(), this._virtual && this.setVirtualListChangedFlag(!0));
        }
        get verticalAlign() {
            return this._verticalAlign;
        }
        set verticalAlign(t) {
            this._verticalAlign != t && (this._verticalAlign = t, this.setBoundsChangedFlag(), 
            this._virtual && this.setVirtualListChangedFlag(!0));
        }
        get virtualItemSize() {
            return this._itemSize;
        }
        set virtualItemSize(t) {
            this._virtual && (null == this._itemSize && (this._itemSize = new Laya.Point()), 
            this._itemSize.setTo(t.x, t.y), this.setVirtualListChangedFlag(!0));
        }
        get defaultItem() {
            return this._defaultItem;
        }
        set defaultItem(t) {
            this._defaultItem = t;
        }
        get autoResizeItem() {
            return this._autoResizeItem;
        }
        set autoResizeItem(t) {
            this._autoResizeItem != t && (this._autoResizeItem = t, this.setBoundsChangedFlag(), 
            this._virtual && this.setVirtualListChangedFlag(!0));
        }
        get selectionMode() {
            return this._selectionMode;
        }
        set selectionMode(t) {
            this._selectionMode = t;
        }
        get selectionController() {
            return this._selectionController;
        }
        set selectionController(t) {
            this._selectionController = t;
        }
        get itemPool() {
            return this._pool;
        }
        getFromPool(t) {
            t || (t = this._defaultItem);
            var e = this._pool.getObject(t);
            return e && (e.visible = !0), e;
        }
        returnToPool(t) {
            t.displayObject.cacheAs = "none", this._pool.returnObject(t);
        }
        addChildAt(e, i) {
            return super.addChildAt(e, i), e instanceof t.GButton && (e.selected = !1, e.changeStateOnClick = !1), 
            e.on(Laya.Event.CLICK, this, this.__clickItem), e;
        }
        addItem(e) {
            return e || (e = this._defaultItem), this.addChild(t.UIPackage.createObjectFromURL(e));
        }
        addItemFromPool(t) {
            return this.addChild(this.getFromPool(t));
        }
        removeChildAt(t, e) {
            var i = super.removeChildAt(t);
            return e ? i.dispose() : i.off(Laya.Event.CLICK, this, this.__clickItem), i;
        }
        removeChildToPoolAt(t) {
            var e = super.removeChildAt(t);
            this.returnToPool(e);
        }
        removeChildToPool(t) {
            super.removeChild(t), this.returnToPool(t);
        }
        removeChildrenToPool(t, e) {
            null == t && (t = 0), null == e && (e = -1), (e < 0 || e >= this._children.length) && (e = this._children.length - 1);
            for (var i = t; i <= e; ++i) this.removeChildToPoolAt(t);
        }
        get selectedIndex() {
            var e;
            if (this._virtual) for (e = 0; e < this._realNumItems; e++) {
                var i = this._virtualItems[e];
                if (i.obj instanceof t.GButton && i.obj.selected || null == i.obj && i.selected) return this._loop ? e % this._numItems : e;
            } else {
                var s = this._children.length;
                for (e = 0; e < s; e++) {
                    var h = this._children[e];
                    if (h instanceof t.GButton && h.selected) return e;
                }
            }
            return -1;
        }
        set selectedIndex(e) {
            e >= 0 && e < this.numItems ? (this._selectionMode != t.ListSelectionMode.Single && this.clearSelection(), 
            this.addSelection(e)) : this.clearSelection();
        }
        getSelection(e) {
            var i;
            if (e || (e = new Array()), this._virtual) for (i = 0; i < this._realNumItems; i++) {
                var s = this._virtualItems[i];
                if (s.obj instanceof t.GButton && s.obj.selected || null == s.obj && s.selected) {
                    var h = i;
                    if (this._loop && (h = i % this._numItems, -1 != e.indexOf(h))) continue;
                    e.push(h);
                }
            } else {
                var r = this._children.length;
                for (i = 0; i < r; i++) {
                    var a = this._children[i];
                    a instanceof t.GButton && a.selected && e.push(i);
                }
            }
            return e;
        }
        addSelection(e, i) {
            if (this._selectionMode != t.ListSelectionMode.None) {
                var s;
                if (this.checkVirtualList(), this._selectionMode == t.ListSelectionMode.Single && this.clearSelection(), 
                i && this.scrollToView(e), this._lastSelectedIndex = e, this._virtual) {
                    var h = this._virtualItems[e];
                    h.obj && (s = h.obj), h.selected = !0;
                } else s = this.getChildAt(e);
                s instanceof t.GButton && !s.selected && (s.selected = !0, this.updateSelectionController(e));
            }
        }
        removeSelection(e) {
            if (this._selectionMode != t.ListSelectionMode.None) {
                var i;
                if (this._virtual) {
                    var s = this._virtualItems[e];
                    s.obj && (i = s.obj), s.selected = !1;
                } else i = this.getChildAt(e);
                i instanceof t.GButton && (i.selected = !1);
            }
        }
        clearSelection() {
            var e;
            if (this._virtual) for (e = 0; e < this._realNumItems; e++) {
                var i = this._virtualItems[e];
                i.obj instanceof t.GButton && (i.obj.selected = !1), i.selected = !1;
            } else {
                var s = this._children.length;
                for (e = 0; e < s; e++) {
                    var h = this._children[e];
                    h instanceof t.GButton && (h.selected = !1);
                }
            }
        }
        clearSelectionExcept(e) {
            var i;
            if (this._virtual) for (i = 0; i < this._realNumItems; i++) {
                var s = this._virtualItems[i];
                s.obj != e && (s.obj instanceof t.GButton && (s.obj.selected = !1), s.selected = !1);
            } else {
                var h = this._children.length;
                for (i = 0; i < h; i++) {
                    var r = this._children[i];
                    r instanceof t.GButton && r != e && (r.selected = !1);
                }
            }
        }
        selectAll() {
            this.checkVirtualList();
            var e, i = -1;
            if (this._virtual) for (e = 0; e < this._realNumItems; e++) {
                var s = this._virtualItems[e];
                s.obj instanceof t.GButton && !s.obj.selected && (s.obj.selected = !0, i = e), s.selected = !0;
            } else {
                var h = this._children.length;
                for (e = 0; e < h; e++) {
                    var r = this._children[e];
                    r instanceof t.GButton && !r.selected && (r.selected = !0, i = e);
                }
            }
            -1 != i && this.updateSelectionController(i);
        }
        selectNone() {
            this.clearSelection();
        }
        selectReverse() {
            this.checkVirtualList();
            var e, i = -1;
            if (this._virtual) for (e = 0; e < this._realNumItems; e++) {
                var s = this._virtualItems[e];
                s.obj instanceof t.GButton && (s.obj.selected = !s.obj.selected, s.obj.selected && (i = e)), 
                s.selected = !s.selected;
            } else {
                var h = this._children.length;
                for (e = 0; e < h; e++) {
                    var r = this._children[e];
                    r instanceof t.GButton && (r.selected = !r.selected, r.selected && (i = e));
                }
            }
            -1 != i && this.updateSelectionController(i);
        }
        handleArrowKey(e) {
            var i = this.selectedIndex;
            if (-1 != i) switch (e) {
              case 1:
                if (this._layout == t.ListLayoutType.SingleColumn || this._layout == t.ListLayoutType.FlowVertical) --i >= 0 && (this.clearSelection(), 
                this.addSelection(i, !0)); else if (this._layout == t.ListLayoutType.FlowHorizontal || this._layout == t.ListLayoutType.Pagination) {
                    for (var s = this._children[i], h = 0, r = i - 1; r >= 0; r--) {
                        var a = this._children[r];
                        if (a.y != s.y) {
                            s = a;
                            break;
                        }
                        h++;
                    }
                    for (;r >= 0; r--) if ((a = this._children[r]).y != s.y) {
                        this.clearSelection(), this.addSelection(r + h + 1, !0);
                        break;
                    }
                }
                break;

              case 3:
                if (this._layout == t.ListLayoutType.SingleRow || this._layout == t.ListLayoutType.FlowHorizontal || this._layout == t.ListLayoutType.Pagination) ++i < this.numItems && (this.clearSelection(), 
                this.addSelection(i, !0)); else if (this._layout == t.ListLayoutType.FlowVertical) {
                    s = this._children[i], h = 0;
                    var n = this._children.length;
                    for (r = i + 1; r < n; r++) {
                        if ((a = this._children[r]).x != s.x) {
                            s = a;
                            break;
                        }
                        h++;
                    }
                    for (;r < n; r++) if ((a = this._children[r]).x != s.x) {
                        this.clearSelection(), this.addSelection(r - h - 1, !0);
                        break;
                    }
                }
                break;

              case 5:
                if (this._layout == t.ListLayoutType.SingleColumn || this._layout == t.ListLayoutType.FlowVertical) ++i < this.numItems && (this.clearSelection(), 
                this.addSelection(i, !0)); else if (this._layout == t.ListLayoutType.FlowHorizontal || this._layout == t.ListLayoutType.Pagination) {
                    for (s = this._children[i], h = 0, n = this._children.length, r = i + 1; r < n; r++) {
                        if ((a = this._children[r]).y != s.y) {
                            s = a;
                            break;
                        }
                        h++;
                    }
                    for (;r < n; r++) if ((a = this._children[r]).y != s.y) {
                        this.clearSelection(), this.addSelection(r - h - 1, !0);
                        break;
                    }
                }
                break;

              case 7:
                if (this._layout == t.ListLayoutType.SingleRow || this._layout == t.ListLayoutType.FlowHorizontal || this._layout == t.ListLayoutType.Pagination) --i >= 0 && (this.clearSelection(), 
                this.addSelection(i, !0)); else if (this._layout == t.ListLayoutType.FlowVertical) {
                    for (s = this._children[i], h = 0, r = i - 1; r >= 0; r--) {
                        if ((a = this._children[r]).x != s.x) {
                            s = a;
                            break;
                        }
                        h++;
                    }
                    for (;r >= 0; r--) if ((a = this._children[r]).x != s.x) {
                        this.clearSelection(), this.addSelection(r + h + 1, !0);
                        break;
                    }
                }
            }
        }
        __clickItem(e) {
            if (!this._scrollPane || !this._scrollPane.isDragged) {
                var i = t.GObject.cast(e.currentTarget);
                this.setSelectionOnEvent(i, e), this._scrollPane && this.scrollItemToViewOnClick && this._scrollPane.scrollToView(i, !0), 
                this.dispatchItemEvent(i, t.Events.createEvent(t.Events.CLICK_ITEM, this.displayObject, e));
            }
        }
        dispatchItemEvent(e, i) {
            this.displayObject.event(t.Events.CLICK_ITEM, [ e, i ]);
        }
        setSelectionOnEvent(e, i) {
            if (e instanceof t.GButton && this._selectionMode != t.ListSelectionMode.None) {
                var s = !1, h = this.childIndexToItemIndex(this.getChildIndex(e));
                if (this._selectionMode == t.ListSelectionMode.Single) e.selected || (this.clearSelectionExcept(e), 
                e.selected = !0); else if (i.shiftKey) {
                    if (!e.selected) if (-1 != this._lastSelectedIndex) {
                        var r, a = Math.min(this._lastSelectedIndex, h), n = Math.max(this._lastSelectedIndex, h);
                        if (n = Math.min(n, this.numItems - 1), this._virtual) for (r = a; r <= n; r++) {
                            var o = this._virtualItems[r];
                            o.obj instanceof t.GButton && (o.obj.selected = !0), o.selected = !0;
                        } else for (r = a; r <= n; r++) {
                            var l = this.getChildAt(r);
                            l instanceof t.GButton && (l.selected = !0);
                        }
                        s = !0;
                    } else e.selected = !0;
                } else i.ctrlKey || this._selectionMode == t.ListSelectionMode.Multiple_SingleClick ? e.selected = !e.selected : e.selected ? this.clearSelectionExcept(e) : (this.clearSelectionExcept(e), 
                e.selected = !0);
                s || (this._lastSelectedIndex = h), e.selected && this.updateSelectionController(h);
            }
        }
        resizeToFit(e, i) {
            null == e && (e = 1e5), i = i || 0, this.ensureBoundsCorrect();
            var s = this.numItems;
            if (e > s && (e = s), this._virtual) {
                var h = Math.ceil(e / this._curLineItemCount);
                this._layout == t.ListLayoutType.SingleColumn || this._layout == t.ListLayoutType.FlowHorizontal ? this.viewHeight = h * this._itemSize.y + Math.max(0, h - 1) * this._lineGap : this.viewWidth = h * this._itemSize.x + Math.max(0, h - 1) * this._columnGap;
            } else if (0 == e) this._layout == t.ListLayoutType.SingleColumn || this._layout == t.ListLayoutType.FlowHorizontal ? this.viewHeight = i : this.viewWidth = i; else {
                for (var r = e - 1, a = null; r >= 0 && (a = this.getChildAt(r), this.foldInvisibleItems && !a.visible); ) r--;
                if (r < 0) this._layout == t.ListLayoutType.SingleColumn || this._layout == t.ListLayoutType.FlowHorizontal ? this.viewHeight = i : this.viewWidth = i; else {
                    var n = 0;
                    this._layout == t.ListLayoutType.SingleColumn || this._layout == t.ListLayoutType.FlowHorizontal ? ((n = a.y + a.height) < i && (n = i), 
                    this.viewHeight = n) : ((n = a.x + a.width) < i && (n = i), this.viewWidth = n);
                }
            }
        }
        getMaxItemWidth() {
            for (var t = this._children.length, e = 0, i = 0; i < t; i++) {
                var s = this.getChildAt(i);
                s.width > e && (e = s.width);
            }
            return e;
        }
        handleSizeChanged() {
            super.handleSizeChanged(), this.setBoundsChangedFlag(), this._virtual && this.setVirtualListChangedFlag(!0);
        }
        handleControllerChanged(t) {
            super.handleControllerChanged(t), this._selectionController == t && (this.selectedIndex = t.selectedIndex);
        }
        updateSelectionController(t) {
            if (this._selectionController && !this._selectionController.changing && t < this._selectionController.pageCount) {
                var e = this._selectionController;
                this._selectionController = null, e.selectedIndex = t, this._selectionController = e;
            }
        }
        shouldSnapToNext(e, i, s) {
            return e < 0 && i > t.UIConfig.defaultScrollSnappingThreshold * s || e > 0 && i > (1 - t.UIConfig.defaultScrollSnappingThreshold) * s || 0 == e && i > s / 2;
        }
        getSnappingPositionWithDir(i, s, h, r, a) {
            var n, o, l;
            return this._virtual ? (a || (a = new Laya.Point()), this._layout == t.ListLayoutType.SingleColumn || this._layout == t.ListLayoutType.FlowHorizontal ? (n = s, 
            e = s, o = this.getIndexOnPos1(!1), s = e, o < this._virtualItems.length && o < this._realNumItems && (l = this._virtualItems[o].height, 
            this.shouldSnapToNext(r, n - s, l) && (s += l + this._lineGap))) : this._layout == t.ListLayoutType.SingleRow || this._layout == t.ListLayoutType.FlowVertical ? (n = i, 
            e = i, o = this.getIndexOnPos2(!1), i = e, o < this._virtualItems.length && o < this._realNumItems && (l = this._virtualItems[o].width, 
            this.shouldSnapToNext(h, n - i, l) && (i += l + this._columnGap))) : (n = i, e = i, 
            o = this.getIndexOnPos3(!1), i = e, o < this._virtualItems.length && o < this._realNumItems && (l = this._virtualItems[o].width, 
            this.shouldSnapToNext(h, n - i, l) && (i += l + this._columnGap))), a.x = i, a.y = s, 
            a) : super.getSnappingPositionWithDir(i, s, h, r, a);
        }
        scrollToView(e, i, s) {
            if (this._virtual) {
                if (0 == this._numItems) return;
                if (this.checkVirtualList(), e >= this._virtualItems.length) throw new Error("Invalid child index: " + e + ">" + this._virtualItems.length);
                var h;
                this._loop && (e = Math.floor(this._firstIndex / this._numItems) * this._numItems + e);
                var r, a = this._virtualItems[e], n = 0;
                if (this._layout == t.ListLayoutType.SingleColumn || this._layout == t.ListLayoutType.FlowHorizontal) {
                    for (r = this._curLineItemCount - 1; r < e; r += this._curLineItemCount) n += this._virtualItems[r].height + this._lineGap;
                    h = new Laya.Rectangle(0, n, this._itemSize.x, a.height);
                } else if (this._layout == t.ListLayoutType.SingleRow || this._layout == t.ListLayoutType.FlowVertical) {
                    for (r = this._curLineItemCount - 1; r < e; r += this._curLineItemCount) n += this._virtualItems[r].width + this._columnGap;
                    h = new Laya.Rectangle(n, 0, a.width, this._itemSize.y);
                } else {
                    var o = e / (this._curLineItemCount * this._curLineItemCount2);
                    h = new Laya.Rectangle(o * this.viewWidth + e % this._curLineItemCount * (a.width + this._columnGap), e / this._curLineItemCount % this._curLineItemCount2 * (a.height + this._lineGap), a.width, a.height);
                }
                this._scrollPane && this._scrollPane.scrollToView(h, i, s);
            } else {
                var l = this.getChildAt(e);
                this._scrollPane ? this._scrollPane.scrollToView(l, i, s) : this._parent && this._parent.scrollPane && this._parent.scrollPane.scrollToView(l, i, s);
            }
        }
        getFirstChildInView() {
            return this.childIndexToItemIndex(super.getFirstChildInView());
        }
        childIndexToItemIndex(e) {
            if (!this._virtual) return e;
            if (this._layout == t.ListLayoutType.Pagination) {
                for (var i = this._firstIndex; i < this._realNumItems; i++) if (this._virtualItems[i].obj && --e < 0) return i;
                return e;
            }
            return e += this._firstIndex, this._loop && this._numItems > 0 && (e %= this._numItems), 
            e;
        }
        itemIndexToChildIndex(e) {
            if (!this._virtual) return e;
            if (this._layout == t.ListLayoutType.Pagination) return this.getChildIndex(this._virtualItems[e].obj);
            if (this._loop && this._numItems > 0) {
                var i = this._firstIndex % this._numItems;
                e >= i ? e -= i : e = this._numItems - i + e;
            } else e -= this._firstIndex;
            return e;
        }
        setVirtual() {
            this._setVirtual(!1);
        }
        setVirtualAndLoop() {
            this._setVirtual(!0);
        }
        _setVirtual(e) {
            if (!this._virtual) {
                if (null == this._scrollPane) throw new Error("Virtual list must be scrollable!");
                if (e) {
                    if (this._layout == t.ListLayoutType.FlowHorizontal || this._layout == t.ListLayoutType.FlowVertical) throw new Error("Loop list instanceof not supported for FlowHorizontal or FlowVertical this.layout!");
                    this._scrollPane.bouncebackEffect = !1;
                }
                if (this._virtual = !0, this._loop = e, this._virtualItems = new Array(), this.removeChildrenToPool(), 
                null == this._itemSize) {
                    this._itemSize = new Laya.Point();
                    var i = this.getFromPool(null);
                    if (null == i) throw new Error("Virtual List must have a default list item resource.");
                    this._itemSize.x = i.width, this._itemSize.y = i.height, this.returnToPool(i);
                }
                this._layout == t.ListLayoutType.SingleColumn || this._layout == t.ListLayoutType.FlowHorizontal ? (this._scrollPane.scrollStep = this._itemSize.y, 
                this._loop && (this._scrollPane._loop = 2)) : (this._scrollPane.scrollStep = this._itemSize.x, 
                this._loop && (this._scrollPane._loop = 1)), this.on(t.Events.SCROLL, this, this.__scrolled), 
                this.setVirtualListChangedFlag(!0);
            }
        }
        get numItems() {
            return this._virtual ? this._numItems : this._children.length;
        }
        set numItems(t) {
            var e;
            if (this._virtual) {
                if (null == this.itemRenderer) throw new Error("set itemRenderer first!");
                this._numItems = t, this._loop ? this._realNumItems = 6 * this._numItems : this._realNumItems = this._numItems;
                var i = this._virtualItems.length;
                if (this._realNumItems > i) for (e = i; e < this._realNumItems; e++) {
                    var s = {
                        width: this._itemSize.x,
                        height: this._itemSize.y,
                        updateFlag: 0
                    };
                    this._virtualItems.push(s);
                } else for (e = this._realNumItems; e < i; e++) this._virtualItems[e].selected = !1;
                0 != this._virtualListChanged && Laya.timer.clear(this, this._refreshVirtualList), 
                this._refreshVirtualList();
            } else {
                var h = this._children.length;
                if (t > h) for (e = h; e < t; e++) null == this.itemProvider ? this.addItemFromPool() : this.addItemFromPool(this.itemProvider.runWith(e)); else this.removeChildrenToPool(t, h);
                if (null != this.itemRenderer) for (e = 0; e < t; e++) this.itemRenderer.runWith([ e, this.getChildAt(e) ]);
            }
        }
        refreshVirtualList() {
            this.setVirtualListChangedFlag(!1);
        }
        checkVirtualList() {
            0 != this._virtualListChanged && (this._refreshVirtualList(), Laya.timer.clear(this, this._refreshVirtualList));
        }
        setVirtualListChangedFlag(t) {
            t ? this._virtualListChanged = 2 : 0 == this._virtualListChanged && (this._virtualListChanged = 1), 
            Laya.timer.callLater(this, this._refreshVirtualList);
        }
        _refreshVirtualList() {
            if (this._displayObject) {
                var e = 2 == this._virtualListChanged;
                this._virtualListChanged = 0, this._eventLocked = !0, e && (this._layout == t.ListLayoutType.SingleColumn || this._layout == t.ListLayoutType.SingleRow ? this._curLineItemCount = 1 : this._layout == t.ListLayoutType.FlowHorizontal ? this._columnCount > 0 ? this._curLineItemCount = this._columnCount : (this._curLineItemCount = Math.floor((this._scrollPane.viewWidth + this._columnGap) / (this._itemSize.x + this._columnGap)), 
                this._curLineItemCount <= 0 && (this._curLineItemCount = 1)) : this._layout == t.ListLayoutType.FlowVertical ? this._lineCount > 0 ? this._curLineItemCount = this._lineCount : (this._curLineItemCount = Math.floor((this._scrollPane.viewHeight + this._lineGap) / (this._itemSize.y + this._lineGap)), 
                this._curLineItemCount <= 0 && (this._curLineItemCount = 1)) : (this._columnCount > 0 ? this._curLineItemCount = this._columnCount : (this._curLineItemCount = Math.floor((this._scrollPane.viewWidth + this._columnGap) / (this._itemSize.x + this._columnGap)), 
                this._curLineItemCount <= 0 && (this._curLineItemCount = 1)), this._lineCount > 0 ? this._curLineItemCount2 = this._lineCount : (this._curLineItemCount2 = Math.floor((this._scrollPane.viewHeight + this._lineGap) / (this._itemSize.y + this._lineGap)), 
                this._curLineItemCount2 <= 0 && (this._curLineItemCount2 = 1))));
                var i = 0, s = 0;
                if (this._realNumItems > 0) {
                    var h, r = Math.ceil(this._realNumItems / this._curLineItemCount) * this._curLineItemCount, a = Math.min(this._curLineItemCount, this._realNumItems);
                    if (this._layout == t.ListLayoutType.SingleColumn || this._layout == t.ListLayoutType.FlowHorizontal) {
                        for (h = 0; h < r; h += this._curLineItemCount) i += this._virtualItems[h].height + this._lineGap;
                        if (i > 0 && (i -= this._lineGap), this._autoResizeItem) s = this._scrollPane.viewWidth; else {
                            for (h = 0; h < a; h++) s += this._virtualItems[h].width + this._columnGap;
                            s > 0 && (s -= this._columnGap);
                        }
                    } else if (this._layout == t.ListLayoutType.SingleRow || this._layout == t.ListLayoutType.FlowVertical) {
                        for (h = 0; h < r; h += this._curLineItemCount) s += this._virtualItems[h].width + this._columnGap;
                        if (s > 0 && (s -= this._columnGap), this._autoResizeItem) i = this._scrollPane.viewHeight; else {
                            for (h = 0; h < a; h++) i += this._virtualItems[h].height + this._lineGap;
                            i > 0 && (i -= this._lineGap);
                        }
                    } else s = Math.ceil(r / (this._curLineItemCount * this._curLineItemCount2)) * this.viewWidth, 
                    i = this.viewHeight;
                }
                this.handleAlign(s, i), this._scrollPane.setContentSize(s, i), this._eventLocked = !1, 
                this.handleScroll(!0);
            }
        }
        __scrolled(t) {
            this.handleScroll(!1);
        }
        getIndexOnPos1(t) {
            if (this._realNumItems < this._curLineItemCount) return e = 0, 0;
            var i, s, h;
            if (this.numChildren > 0 && !t) {
                if ((s = this.getChildAt(0).y) > e) {
                    for (i = this._firstIndex - this._curLineItemCount; i >= 0; i -= this._curLineItemCount) if ((s -= this._virtualItems[i].height + this._lineGap) <= e) return e = s, 
                    i;
                    return e = 0, 0;
                }
                for (i = this._firstIndex; i < this._realNumItems; i += this._curLineItemCount) {
                    if ((h = s + this._virtualItems[i].height + this._lineGap) > e) return e = s, i;
                    s = h;
                }
                return e = s, this._realNumItems - this._curLineItemCount;
            }
            for (s = 0, i = 0; i < this._realNumItems; i += this._curLineItemCount) {
                if ((h = s + this._virtualItems[i].height + this._lineGap) > e) return e = s, i;
                s = h;
            }
            return e = s, this._realNumItems - this._curLineItemCount;
        }
        getIndexOnPos2(t) {
            if (this._realNumItems < this._curLineItemCount) return e = 0, 0;
            var i, s, h;
            if (this.numChildren > 0 && !t) {
                if ((s = this.getChildAt(0).x) > e) {
                    for (i = this._firstIndex - this._curLineItemCount; i >= 0; i -= this._curLineItemCount) if ((s -= this._virtualItems[i].width + this._columnGap) <= e) return e = s, 
                    i;
                    return e = 0, 0;
                }
                for (i = this._firstIndex; i < this._realNumItems; i += this._curLineItemCount) {
                    if ((h = s + this._virtualItems[i].width + this._columnGap) > e) return e = s, i;
                    s = h;
                }
                return e = s, this._realNumItems - this._curLineItemCount;
            }
            for (s = 0, i = 0; i < this._realNumItems; i += this._curLineItemCount) {
                if ((h = s + this._virtualItems[i].width + this._columnGap) > e) return e = s, i;
                s = h;
            }
            return e = s, this._realNumItems - this._curLineItemCount;
        }
        getIndexOnPos3(t) {
            if (this._realNumItems < this._curLineItemCount) return e = 0, 0;
            var i, s, h = this.viewWidth, r = Math.floor(e / h), a = r * (this._curLineItemCount * this._curLineItemCount2), n = r * h;
            for (i = 0; i < this._curLineItemCount; i++) {
                if ((s = n + this._virtualItems[a + i].width + this._columnGap) > e) return e = n, 
                a + i;
                n = s;
            }
            return e = n, a + this._curLineItemCount - 1;
        }
        handleScroll(e) {
            if (!this._eventLocked) {
                if (this._layout == t.ListLayoutType.SingleColumn || this._layout == t.ListLayoutType.FlowHorizontal) {
                    for (var i = 0; this.handleScroll1(e); ) if (e = !1, ++i > 20) {
                        console.log("FairyGUI: list will never be <the> filled item renderer function always returns a different size.");
                        break;
                    }
                    this.handleArchOrder1();
                } else if (this._layout == t.ListLayoutType.SingleRow || this._layout == t.ListLayoutType.FlowVertical) {
                    for (i = 0; this.handleScroll2(e); ) if (e = !1, ++i > 20) {
                        console.log("FairyGUI: list will never be <the> filled item renderer function always returns a different size.");
                        break;
                    }
                    this.handleArchOrder2();
                } else this.handleScroll3(e);
                this._boundsChanged = !1;
            }
        }
        handleScroll1(i) {
            var s = this._scrollPane.scrollingPosY, h = s + this._scrollPane.viewHeight, r = h == this._scrollPane.contentHeight;
            e = s;
            var a = this.getIndexOnPos1(i);
            if (s = e, a == this._firstIndex && !i) return !1;
            var n = this._firstIndex;
            this._firstIndex = a;
            var o, l, _, d, c, u = a, g = n > a, p = this.numChildren, f = n + p - 1, y = g ? f : n, m = 0, v = s, w = 0, C = 0, b = this.defaultItem, S = (this._scrollPane.viewWidth - this._columnGap * (this._curLineItemCount - 1)) / this._curLineItemCount;
            for (this.itemInfoVer++; u < this._realNumItems && (r || v < h); ) {
                if ((null == (l = this._virtualItems[u]).obj || i) && (null != this.itemProvider && (null == (b = this.itemProvider.runWith(u % this._numItems)) && (b = this._defaultItem), 
                b = t.UIPackage.normalizeURL(b)), l.obj && l.obj.resourceURL != b && (l.obj instanceof t.GButton && (l.selected = l.obj.selected), 
                this.removeChildToPool(l.obj), l.obj = null)), null == l.obj) {
                    if (g) {
                        for (c = y; c >= n; c--) if ((_ = this._virtualItems[c]).obj && _.updateFlag != this.itemInfoVer && _.obj.resourceURL == b) {
                            _.obj instanceof t.GButton && (_.selected = _.obj.selected), l.obj = _.obj, _.obj = null, 
                            c == y && y--;
                            break;
                        }
                    } else for (c = y; c <= f; c++) if ((_ = this._virtualItems[c]).obj && _.updateFlag != this.itemInfoVer && _.obj.resourceURL == b) {
                        _.obj instanceof t.GButton && (_.selected = _.obj.selected), l.obj = _.obj, _.obj = null, 
                        c == y && y++;
                        break;
                    }
                    l.obj ? this.setChildIndex(l.obj, g ? u - a : this.numChildren) : (l.obj = this._pool.getObject(b), 
                    g ? this.addChildAt(l.obj, u - a) : this.addChild(l.obj)), l.obj instanceof t.GButton && (l.obj.selected = l.selected), 
                    o = !0;
                } else o = i;
                o && (this._autoResizeItem && (this._layout == t.ListLayoutType.SingleColumn || this._columnCount > 0) && l.obj.setSize(S, l.obj.height, !0), 
                this.itemRenderer.runWith([ u % this._numItems, l.obj ]), u % this._curLineItemCount == 0 && (w += Math.ceil(l.obj.height) - l.height, 
                u == a && n > a && (C = Math.ceil(l.obj.height) - l.height)), l.width = Math.ceil(l.obj.width), 
                l.height = Math.ceil(l.obj.height)), l.updateFlag = this.itemInfoVer, l.obj.setXY(m, v), 
                u == a && (h += l.height), m += l.width + this._columnGap, u % this._curLineItemCount == this._curLineItemCount - 1 && (m = 0, 
                v += l.height + this._lineGap), u++;
            }
            for (d = 0; d < p; d++) (l = this._virtualItems[n + d]).updateFlag != this.itemInfoVer && l.obj && (l.obj instanceof t.GButton && (l.selected = l.obj.selected), 
            this.removeChildToPool(l.obj), l.obj = null);
            for (p = this._children.length, d = 0; d < p; d++) {
                var x = this._virtualItems[a + d].obj;
                this._children[d] != x && this.setChildIndex(x, d);
            }
            return 0 == w && 0 == C || this._scrollPane.changeContentSizeOnScrolling(0, w, 0, C), 
            u > 0 && this.numChildren > 0 && this._container.y <= 0 && this.getChildAt(0).y > -this._container.y;
        }
        handleScroll2(i) {
            var s = this._scrollPane.scrollingPosX, h = s + this._scrollPane.viewWidth, r = s == this._scrollPane.contentWidth;
            e = s;
            var a = this.getIndexOnPos2(i);
            if (s = e, a == this._firstIndex && !i) return !1;
            var n = this._firstIndex;
            this._firstIndex = a;
            var o, l, _, d, c, u = a, g = n > a, p = this.numChildren, f = n + p - 1, y = g ? f : n, m = s, v = 0, w = 0, C = 0, b = this.defaultItem, S = (this._scrollPane.viewHeight - this._lineGap * (this._curLineItemCount - 1)) / this._curLineItemCount;
            for (this.itemInfoVer++; u < this._realNumItems && (r || m < h); ) {
                if ((null == (l = this._virtualItems[u]).obj || i) && (null != this.itemProvider && (null == (b = this.itemProvider.runWith(u % this._numItems)) && (b = this._defaultItem), 
                b = t.UIPackage.normalizeURL(b)), l.obj && l.obj.resourceURL != b && (l.obj instanceof t.GButton && (l.selected = l.obj.selected), 
                this.removeChildToPool(l.obj), l.obj = null)), null == l.obj) {
                    if (g) {
                        for (c = y; c >= n; c--) if ((_ = this._virtualItems[c]).obj && _.updateFlag != this.itemInfoVer && _.obj.resourceURL == b) {
                            _.obj instanceof t.GButton && (_.selected = _.obj.selected), l.obj = _.obj, _.obj = null, 
                            c == y && y--;
                            break;
                        }
                    } else for (c = y; c <= f; c++) if ((_ = this._virtualItems[c]).obj && _.updateFlag != this.itemInfoVer && _.obj.resourceURL == b) {
                        _.obj instanceof t.GButton && (_.selected = _.obj.selected), l.obj = _.obj, _.obj = null, 
                        c == y && y++;
                        break;
                    }
                    l.obj ? this.setChildIndex(l.obj, g ? u - a : this.numChildren) : (l.obj = this._pool.getObject(b), 
                    g ? this.addChildAt(l.obj, u - a) : this.addChild(l.obj)), l.obj instanceof t.GButton && (l.obj.selected = l.selected), 
                    o = !0;
                } else o = i;
                o && (this._autoResizeItem && (this._layout == t.ListLayoutType.SingleRow || this._lineCount > 0) && l.obj.setSize(l.obj.width, S, !0), 
                this.itemRenderer.runWith([ u % this._numItems, l.obj ]), u % this._curLineItemCount == 0 && (w += Math.ceil(l.obj.width) - l.width, 
                u == a && n > a && (C = Math.ceil(l.obj.width) - l.width)), l.width = Math.ceil(l.obj.width), 
                l.height = Math.ceil(l.obj.height)), l.updateFlag = this.itemInfoVer, l.obj.setXY(m, v), 
                u == a && (h += l.width), v += l.height + this._lineGap, u % this._curLineItemCount == this._curLineItemCount - 1 && (v = 0, 
                m += l.width + this._columnGap), u++;
            }
            for (d = 0; d < p; d++) (l = this._virtualItems[n + d]).updateFlag != this.itemInfoVer && l.obj && (l.obj instanceof t.GButton && (l.selected = l.obj.selected), 
            this.removeChildToPool(l.obj), l.obj = null);
            for (p = this._children.length, d = 0; d < p; d++) {
                var x = this._virtualItems[a + d].obj;
                this._children[d] != x && this.setChildIndex(x, d);
            }
            return 0 == w && 0 == C || this._scrollPane.changeContentSizeOnScrolling(w, 0, C, 0), 
            u > 0 && this.numChildren > 0 && this._container.x <= 0 && this.getChildAt(0).x > -this._container.x;
        }
        handleScroll3(i) {
            var s = this._scrollPane.scrollingPosX;
            e = s;
            var h = this.getIndexOnPos3(i);
            if (s = e, h != this._firstIndex || i) {
                var r = this._firstIndex;
                this._firstIndex = h;
                var a, n, o, l, _, d = r, c = this._virtualItems.length, u = this._curLineItemCount * this._curLineItemCount2, g = h % this._curLineItemCount, p = this.viewWidth, f = Math.floor(h / u) * u, y = f + 2 * u, m = this._defaultItem, v = (this._scrollPane.viewWidth - this._columnGap * (this._curLineItemCount - 1)) / this._curLineItemCount, w = (this._scrollPane.viewHeight - this._lineGap * (this._curLineItemCount2 - 1)) / this._curLineItemCount2;
                for (this.itemInfoVer++, n = f; n < y; n++) if (!(n >= this._realNumItems)) {
                    if (_ = n % this._curLineItemCount, n - f < u) {
                        if (_ < g) continue;
                    } else if (_ > g) continue;
                    (o = this._virtualItems[n]).updateFlag = this.itemInfoVer;
                }
                var C = null, b = 0;
                for (n = f; n < y; n++) if (!(n >= this._realNumItems) && (o = this._virtualItems[n]).updateFlag == this.itemInfoVer) {
                    if (null == o.obj) {
                        for (;d < c; ) {
                            if ((l = this._virtualItems[d]).obj && l.updateFlag != this.itemInfoVer) {
                                l.obj instanceof t.GButton && (l.selected = l.obj.selected), o.obj = l.obj, l.obj = null;
                                break;
                            }
                            d++;
                        }
                        -1 == b && (b = this.getChildIndex(C) + 1), null == o.obj ? (null != this.itemProvider && (null == (m = this.itemProvider.runWith(n % this._numItems)) && (m = this._defaultItem), 
                        m = t.UIPackage.normalizeURL(m)), o.obj = this._pool.getObject(m), this.addChildAt(o.obj, b)) : b = this.setChildIndexBefore(o.obj, b), 
                        b++, o.obj instanceof t.GButton && (o.obj.selected = o.selected), a = !0;
                    } else a = i, b = -1, C = o.obj;
                    a && (this._autoResizeItem && (this._curLineItemCount == this._columnCount && this._curLineItemCount2 == this._lineCount ? o.obj.setSize(v, w, !0) : this._curLineItemCount == this._columnCount ? o.obj.setSize(v, o.obj.height, !0) : this._curLineItemCount2 == this._lineCount && o.obj.setSize(o.obj.width, w, !0)), 
                    this.itemRenderer.runWith([ n % this._numItems, o.obj ]), o.width = Math.ceil(o.obj.width), 
                    o.height = Math.ceil(o.obj.height));
                }
                var S = f / u * p, x = S, I = 0, T = 0;
                for (n = f; n < y; n++) n >= this._realNumItems || ((o = this._virtualItems[n]).updateFlag == this.itemInfoVer && o.obj.setXY(x, I), 
                o.height > T && (T = o.height), n % this._curLineItemCount == this._curLineItemCount - 1 ? (x = S, 
                I += T + this._lineGap, T = 0, n == f + u - 1 && (x = S += p, I = 0)) : x += o.width + this._columnGap);
                for (n = d; n < c; n++) (o = this._virtualItems[n]).updateFlag != this.itemInfoVer && o.obj && (o.obj instanceof t.GButton && (o.selected = o.obj.selected), 
                this.removeChildToPool(o.obj), o.obj = null);
            }
        }
        handleArchOrder1() {
            if (this.childrenRenderOrder == t.ChildrenRenderOrder.Arch) {
                for (var e = this._scrollPane.posY + this.viewHeight / 2, i = Number.POSITIVE_INFINITY, s = 0, h = 0, r = this.numChildren, a = 0; a < r; a++) {
                    var n = this.getChildAt(a);
                    this.foldInvisibleItems && !n.visible || (s = Math.abs(e - n.y - n.height / 2)) < i && (i = s, 
                    h = a);
                }
                this.apexIndex = h;
            }
        }
        handleArchOrder2() {
            if (this.childrenRenderOrder == t.ChildrenRenderOrder.Arch) {
                for (var e = this._scrollPane.posX + this.viewWidth / 2, i = Number.POSITIVE_INFINITY, s = 0, h = 0, r = this.numChildren, a = 0; a < r; a++) {
                    var n = this.getChildAt(a);
                    this.foldInvisibleItems && !n.visible || (s = Math.abs(e - n.x - n.width / 2)) < i && (i = s, 
                    h = a);
                }
                this.apexIndex = h;
            }
        }
        handleAlign(t, e) {
            var i = 0, s = 0;
            e < this.viewHeight && ("middle" == this._verticalAlign ? s = Math.floor((this.viewHeight - e) / 2) : "bottom" == this._verticalAlign && (s = this.viewHeight - e)), 
            t < this.viewWidth && ("center" == this._align ? i = Math.floor((this.viewWidth - t) / 2) : "right" == this._align && (i = this.viewWidth - t)), 
            i == this._alignOffset.x && s == this._alignOffset.y || (this._alignOffset.setTo(i, s), 
            this._scrollPane ? this._scrollPane.adjustMaskContainer() : this._container.pos(this._margin.left + this._alignOffset.x, this._margin.top + this._alignOffset.y));
        }
        updateBounds() {
            if (!this._virtual) {
                var e, i, s, h, r, a = 0, n = 0, o = 0, l = 0, _ = 0, d = 0, c = 0, u = this._children.length, g = this.viewWidth, p = this.viewHeight, f = 0, y = 0;
                if (this._layout == t.ListLayoutType.SingleColumn) {
                    for (e = 0; e < u; e++) i = this.getChildAt(e), this.foldInvisibleItems && !i.visible || (0 != n && (n += this._lineGap), 
                    i.y = n, this._autoResizeItem && i.setSize(g, i.height, !0), n += Math.ceil(i.height), 
                    i.width > o && (o = i.width));
                    if ((h = n) <= p && this._autoResizeItem && this._scrollPane && this._scrollPane._displayInDemand && this._scrollPane.vtScrollBar) for (g += this._scrollPane.vtScrollBar.width, 
                    e = 0; e < u; e++) i = this.getChildAt(e), this.foldInvisibleItems && !i.visible || (i.setSize(g, i.height, !0), 
                    i.width > o && (o = i.width));
                    s = Math.ceil(o);
                } else if (this._layout == t.ListLayoutType.SingleRow) {
                    for (e = 0; e < u; e++) i = this.getChildAt(e), this.foldInvisibleItems && !i.visible || (0 != a && (a += this._columnGap), 
                    i.x = a, this._autoResizeItem && i.setSize(i.width, p, !0), a += Math.ceil(i.width), 
                    i.height > l && (l = i.height));
                    if ((s = a) <= g && this._autoResizeItem && this._scrollPane && this._scrollPane._displayInDemand && this._scrollPane.hzScrollBar) for (p += this._scrollPane.hzScrollBar.height, 
                    e = 0; e < u; e++) i = this.getChildAt(e), this.foldInvisibleItems && !i.visible || (i.setSize(i.width, p, !0), 
                    i.height > l && (l = i.height));
                    h = Math.ceil(l);
                } else if (this._layout == t.ListLayoutType.FlowHorizontal) if (this._autoResizeItem && this._columnCount > 0) {
                    for (e = 0; e < u; e++) if (i = this.getChildAt(e), (!this.foldInvisibleItems || i.visible) && (f += i.sourceWidth, 
                    ++_ == this._columnCount || e == u - 1)) {
                        for (r = (g - f - (_ - 1) * this._columnGap) / f, a = 0, _ = y; _ <= e; _++) i = this.getChildAt(_), 
                        this.foldInvisibleItems && !i.visible || (i.setXY(a, n), _ < e ? (i.setSize(i.sourceWidth + Math.round(i.sourceWidth * r), i.height, !0), 
                        a += Math.ceil(i.width) + this._columnGap) : i.setSize(g - a, i.height, !0), i.height > l && (l = i.height));
                        n += Math.ceil(l) + this._lineGap, l = 0, _ = 0, y = e + 1, f = 0;
                    }
                    h = n + Math.ceil(l), s = g;
                } else {
                    for (e = 0; e < u; e++) i = this.getChildAt(e), this.foldInvisibleItems && !i.visible || (0 != a && (a += this._columnGap), 
                    (0 != this._columnCount && _ >= this._columnCount || 0 == this._columnCount && a + i.width > g && 0 != l) && (a = 0, 
                    n += Math.ceil(l) + this._lineGap, l = 0, _ = 0), i.setXY(a, n), (a += Math.ceil(i.width)) > o && (o = a), 
                    i.height > l && (l = i.height), _++);
                    h = n + Math.ceil(l), s = Math.ceil(o);
                } else if (this._layout == t.ListLayoutType.FlowVertical) if (this._autoResizeItem && this._lineCount > 0) {
                    for (e = 0; e < u; e++) if (i = this.getChildAt(e), (!this.foldInvisibleItems || i.visible) && (f += i.sourceHeight, 
                    ++_ == this._lineCount || e == u - 1)) {
                        for (r = (p - f - (_ - 1) * this._lineGap) / f, n = 0, _ = y; _ <= e; _++) i = this.getChildAt(_), 
                        this.foldInvisibleItems && !i.visible || (i.setXY(a, n), _ < e ? (i.setSize(i.width, i.sourceHeight + Math.round(i.sourceHeight * r), !0), 
                        n += Math.ceil(i.height) + this._lineGap) : i.setSize(i.width, p - n, !0), i.width > o && (o = i.width));
                        a += Math.ceil(o) + this._columnGap, o = 0, _ = 0, y = e + 1, f = 0;
                    }
                    s = a + Math.ceil(o), h = p;
                } else {
                    for (e = 0; e < u; e++) i = this.getChildAt(e), this.foldInvisibleItems && !i.visible || (0 != n && (n += this._lineGap), 
                    (0 != this._lineCount && _ >= this._lineCount || 0 == this._lineCount && n + i.height > p && 0 != o) && (n = 0, 
                    a += Math.ceil(o) + this._columnGap, o = 0, _ = 0), i.setXY(a, n), (n += Math.ceil(i.height)) > l && (l = n), 
                    i.width > o && (o = i.width), _++);
                    s = a + Math.ceil(o), h = Math.ceil(l);
                } else {
                    var m;
                    if (this._autoResizeItem && this._lineCount > 0 && (m = Math.floor((p - (this._lineCount - 1) * this._lineGap) / this._lineCount)), 
                    this._autoResizeItem && this._columnCount > 0) {
                        for (e = 0; e < u; e++) if (i = this.getChildAt(e), (!this.foldInvisibleItems || i.visible) && (0 == _ && (0 != this._lineCount && c >= this._lineCount || 0 == this._lineCount && n + i.height > p) && (d++, 
                        n = 0, c = 0), f += i.sourceWidth, ++_ == this._columnCount || e == u - 1)) {
                            for (r = (g - f - (_ - 1) * this._columnGap) / f, a = 0, _ = y; _ <= e; _++) i = this.getChildAt(_), 
                            this.foldInvisibleItems && !i.visible || (i.setXY(d * g + a, n), _ < e ? (i.setSize(i.sourceWidth + Math.round(i.sourceWidth * r), this._lineCount > 0 ? m : i.height, !0), 
                            a += Math.ceil(i.width) + this._columnGap) : i.setSize(g - a, this._lineCount > 0 ? m : i.height, !0), 
                            i.height > l && (l = i.height));
                            n += Math.ceil(l) + this._lineGap, l = 0, _ = 0, y = e + 1, f = 0, c++;
                        }
                    } else for (e = 0; e < u; e++) i = this.getChildAt(e), this.foldInvisibleItems && !i.visible || (0 != a && (a += this._columnGap), 
                    this._autoResizeItem && this._lineCount > 0 && i.setSize(i.width, m, !0), (0 != this._columnCount && _ >= this._columnCount || 0 == this._columnCount && a + i.width > g && 0 != l) && (a = 0, 
                    n += Math.ceil(l) + this._lineGap, l = 0, _ = 0, c++, (0 != this._lineCount && c >= this._lineCount || 0 == this._lineCount && n + i.height > p && 0 != o) && (d++, 
                    n = 0, c = 0)), i.setXY(d * g + a, n), (a += Math.ceil(i.width)) > o && (o = a), 
                    i.height > l && (l = i.height), _++);
                    h = d > 0 ? p : n + Math.ceil(l), s = (d + 1) * g;
                }
                this.handleAlign(s, h), this.setBounds(0, 0, s, h);
            }
        }
        setup_beforeAdd(e, i) {
            var s;
            super.setup_beforeAdd(e, i), e.seek(i, 5), this._layout = e.readByte(), this._selectionMode = e.readByte(), 
            s = e.readByte(), this._align = 0 == s ? "left" : 1 == s ? "center" : "right", s = e.readByte(), 
            this._verticalAlign = 0 == s ? "top" : 1 == s ? "middle" : "bottom", this._lineGap = e.getInt16(), 
            this._columnGap = e.getInt16(), this._lineCount = e.getInt16(), this._columnCount = e.getInt16(), 
            this._autoResizeItem = e.readBool(), this._childrenRenderOrder = e.readByte(), this._apexIndex = e.getInt16(), 
            e.readBool() && (this._margin.top = e.getInt32(), this._margin.bottom = e.getInt32(), 
            this._margin.left = e.getInt32(), this._margin.right = e.getInt32());
            var h = e.readByte();
            if (h == t.OverflowType.Scroll) {
                var r = e.pos;
                e.seek(i, 7), this.setupScroll(e), e.pos = r;
            } else this.setupOverflow(h);
            e.readBool() && e.skip(8), e.version >= 2 && (this.scrollItemToViewOnClick = e.readBool(), 
            this.foldInvisibleItems = e.readBool()), e.seek(i, 8), this._defaultItem = e.readS(), 
            this.readItems(e);
        }
        readItems(t) {
            var e, i, s, h;
            for (e = t.getInt16(), i = 0; i < e; i++) if (s = t.getInt16(), s += t.pos, null != (h = t.readS()) || (h = this.defaultItem)) {
                var r = this.getFromPool(h);
                r && (this.addChild(r), this.setupItem(t, r)), t.pos = s;
            } else t.pos = s;
        }
        setupItem(e, i) {
            var s, h, r;
            if (null != (s = e.readS()) && (i.text = s), null != (s = e.readS()) && i instanceof t.GButton && (i.selectedTitle = s), 
            null != (s = e.readS()) && (i.icon = s), null != (s = e.readS()) && i instanceof t.GButton && (i.selectedIcon = s), 
            null != (s = e.readS()) && (i.name = s), i instanceof t.GComponent) {
                for (h = e.getInt16(), r = 0; r < h; r++) {
                    var a = i.getController(e.readS());
                    s = e.readS(), a && (a.selectedPageId = s);
                }
                if (e.version >= 2) for (h = e.getInt16(), r = 0; r < h; r++) {
                    var n = e.readS(), o = e.getInt16(), l = e.readS(), _ = i.getChildByPath(n);
                    _ && _.setProp(o, l);
                }
            }
        }
        setup_afterAdd(t, e) {
            super.setup_afterAdd(t, e), t.seek(e, 6);
            var i = t.getInt16();
            -1 != i && (this._selectionController = this._parent.getControllerAt(i));
        }
    };
    var e = 0;
}(fgui), function(t) {
    t.GObjectPool = class {
        constructor() {
            this._count = 0, this._pool = {};
        }
        clear() {
            for (var t in this._pool) for (var e = this._pool[t], i = e.length, s = 0; s < i; s++) e[s].dispose();
            this._pool = {}, this._count = 0;
        }
        get count() {
            return this._count;
        }
        getObject(e) {
            if (null == (e = t.UIPackage.normalizeURL(e))) return null;
            var i = this._pool[e];
            return i && i.length > 0 ? (this._count--, i.shift()) : t.UIPackage.createObjectFromURL(e);
        }
        returnObject(t) {
            var e = t.resourceURL;
            if (e) {
                var i = this._pool[e];
                null == i && (i = [], this._pool[e] = i), this._count++, i.push(t);
            }
        }
    };
}(fgui), function(t) {
    class e extends t.GObject {
        constructor() {
            super(), this._url = "", this._fill = t.LoaderFillType.None, this._align = "left", 
            this._valign = "top", this._showErrorSign = !0;
        }
        createDisplayObject() {
            super.createDisplayObject(), this._content = new t.MovieClip(), this._displayObject.addChild(this._content), 
            this._displayObject.mouseEnabled = !0;
        }
        dispose() {
            !this._contentItem && this._content.texture && this.freeExternal(this._content.texture), 
            this._content2 && this._content2.dispose(), super.dispose();
        }
        get url() {
            return this._url;
        }
        set url(t) {
            this._url != t && (this._url = t, this.loadContent(), this.updateGear(7));
        }
        get icon() {
            return this._url;
        }
        set icon(t) {
            this.url = t;
        }
        get align() {
            return this._align;
        }
        set align(t) {
            this._align != t && (this._align = t, this.updateLayout());
        }
        get verticalAlign() {
            return this._valign;
        }
        set verticalAlign(t) {
            this._valign != t && (this._valign = t, this.updateLayout());
        }
        get fill() {
            return this._fill;
        }
        set fill(t) {
            this._fill != t && (this._fill = t, this.updateLayout());
        }
        get shrinkOnly() {
            return this._shrinkOnly;
        }
        set shrinkOnly(t) {
            this._shrinkOnly != t && (this._shrinkOnly = t, this.updateLayout());
        }
        get autoSize() {
            return this._autoSize;
        }
        set autoSize(t) {
            this._autoSize != t && (this._autoSize = t, this.updateLayout());
        }
        get playing() {
            return this._content.playing;
        }
        set playing(t) {
            this._content.playing != t && (this._content.playing = t, this.updateGear(5));
        }
        get frame() {
            return this._content.frame;
        }
        set frame(t) {
            this._content.frame != t && (this._content.frame = t, this.updateGear(5));
        }
        get color() {
            return this._content.color;
        }
        set color(t) {
            this._content.color != t && (this._content.color = t, this.updateGear(4));
        }
        get fillMethod() {
            return this._content.fillMethod;
        }
        set fillMethod(t) {
            this._content.fillMethod = t;
        }
        get fillOrigin() {
            return this._content.fillOrigin;
        }
        set fillOrigin(t) {
            this._content.fillOrigin = t;
        }
        get fillClockwise() {
            return this._content.fillClockwise;
        }
        set fillClockwise(t) {
            this._content.fillClockwise = t;
        }
        get fillAmount() {
            return this._content.fillAmount;
        }
        set fillAmount(t) {
            this._content.fillAmount = t;
        }
        get showErrorSign() {
            return this._showErrorSign;
        }
        set showErrorSign(t) {
            this._showErrorSign = t;
        }
        get content() {
            return this._content;
        }
        get component() {
            return this._content2;
        }
        loadContent() {
            this.clearContent(), this._url && (t.ToolSet.startsWith(this._url, "ui://") ? this.loadFromPackage(this._url) : this.loadExternal());
        }
        loadFromPackage(e) {
            if (this._contentItem = t.UIPackage.getItemByURL(e), this._contentItem) if (this._contentItem = this._contentItem.getBranch(), 
            this.sourceWidth = this._contentItem.width, this.sourceHeight = this._contentItem.height, 
            this._contentItem = this._contentItem.getHighResolution(), this._contentItem.load(), 
            this._autoSize && this.setSize(this.sourceWidth, this.sourceHeight), this._contentItem.type == t.PackageItemType.Image) this._contentItem.texture ? (this._content.texture = this._contentItem.texture, 
            this._content.scale9Grid = this._contentItem.scale9Grid, this._content.scaleByTile = this._contentItem.scaleByTile, 
            this._content.tileGridIndice = this._contentItem.tileGridIndice, this.sourceWidth = this._contentItem.width, 
            this.sourceHeight = this._contentItem.height, this.updateLayout()) : this.setErrorState(); else if (this._contentItem.type == t.PackageItemType.MovieClip) this.sourceWidth = this._contentItem.width, 
            this.sourceHeight = this._contentItem.height, this._content.interval = this._contentItem.interval, 
            this._content.swing = this._contentItem.swing, this._content.repeatDelay = this._contentItem.repeatDelay, 
            this._content.frames = this._contentItem.frames, this.updateLayout(); else if (this._contentItem.type == t.PackageItemType.Component) {
                var i = t.UIPackage.createObjectFromURL(e);
                i ? i instanceof t.GComponent ? (this._content2 = i.asCom, this._displayObject.addChild(this._content2.displayObject), 
                this.updateLayout()) : (i.dispose(), this.setErrorState()) : this.setErrorState();
            } else this.setErrorState(); else this.setErrorState();
        }
        loadExternal() {
            t.AssetProxy.inst.load(this._url, Laya.Handler.create(this, this.__getResCompleted), null, Laya.Loader.IMAGE);
        }
        freeExternal(t) {}
        onExternalLoadSuccess(t) {
            this._content.texture = t, this._content.scale9Grid = null, this._content.scaleByTile = !1, 
            this.sourceWidth = t.width, this.sourceHeight = t.height, this.updateLayout();
        }
        onExternalLoadFailed() {
            this.setErrorState();
        }
        __getResCompleted(t) {
            null != t ? this.onExternalLoadSuccess(t) : this.onExternalLoadFailed();
        }
        setErrorState() {
            this._showErrorSign && (this._errorSign || null != t.UIConfig.loaderErrorSign && (this._errorSign = e._errorSignPool.getObject(t.UIConfig.loaderErrorSign)), 
            this._errorSign && (this._errorSign.setSize(this.width, this.height), this._displayObject.addChild(this._errorSign.displayObject)));
        }
        clearErrorState() {
            this._errorSign && (this._displayObject.removeChild(this._errorSign.displayObject), 
            e._errorSignPool.returnObject(this._errorSign), this._errorSign = null);
        }
        updateLayout() {
            if (!this._content2 && !this._content.texture && !this._content.frames) return void (this._autoSize && (this._updatingLayout = !0, 
            this.setSize(50, 30), this._updatingLayout = !1));
            let e = this.sourceWidth, i = this.sourceHeight;
            if (this._autoSize && (this._updatingLayout = !0, 0 == e && (e = 50), 0 == i && (i = 30), 
            this.setSize(e, i), this._updatingLayout = !1, e == this._width && i == this._height)) this._content2 ? (this._content2.setXY(0, 0), 
            this._content2.setScale(1, 1)) : (this._content.size(e, i), this._content.pos(0, 0)); else {
                var s, h, r = 1, a = 1;
                this._fill != t.LoaderFillType.None && (r = this.width / this.sourceWidth, a = this.height / this.sourceHeight, 
                1 == r && 1 == a || (this._fill == t.LoaderFillType.ScaleMatchHeight ? r = a : this._fill == t.LoaderFillType.ScaleMatchWidth ? a = r : this._fill == t.LoaderFillType.Scale ? r > a ? r = a : a = r : this._fill == t.LoaderFillType.ScaleNoBorder && (r > a ? a = r : r = a), 
                this._shrinkOnly && (r > 1 && (r = 1), a > 1 && (a = 1)), e = this.sourceWidth * r, 
                i = this.sourceHeight * a)), this._content2 ? this._content2.setScale(r, a) : this._content.size(e, i), 
                s = "center" == this._align ? Math.floor((this.width - e) / 2) : "right" == this._align ? this.width - e : 0, 
                h = "middle" == this._valign ? Math.floor((this.height - i) / 2) : "bottom" == this._valign ? this.height - i : 0, 
                this._content2 ? this._content2.setXY(s, h) : this._content.pos(s, h);
            }
        }
        clearContent() {
            this.clearErrorState(), !this._contentItem && this._content.texture && this.freeExternal(this._content.texture), 
            this._content.texture = null, this._content.frames = null, this._content2 && (this._content2.dispose(), 
            this._content2 = null), this._contentItem = null;
        }
        handleSizeChanged() {
            super.handleSizeChanged(), this._updatingLayout || this.updateLayout();
        }
        getProp(e) {
            switch (e) {
              case t.ObjectPropID.Color:
                return this.color;

              case t.ObjectPropID.Playing:
                return this.playing;

              case t.ObjectPropID.Frame:
                return this.frame;

              case t.ObjectPropID.TimeScale:
                return this._content.timeScale;

              default:
                return super.getProp(e);
            }
        }
        setProp(e, i) {
            switch (e) {
              case t.ObjectPropID.Color:
                this.color = i;
                break;

              case t.ObjectPropID.Playing:
                this.playing = i;
                break;

              case t.ObjectPropID.Frame:
                this.frame = i;
                break;

              case t.ObjectPropID.TimeScale:
                this._content.timeScale = i;
                break;

              case t.ObjectPropID.DeltaTime:
                this._content.advance(i);
                break;

              default:
                super.setProp(e, i);
            }
        }
        setup_beforeAdd(t, e) {
            var i;
            super.setup_beforeAdd(t, e), t.seek(e, 5), this._url = t.readS(), i = t.readByte(), 
            this._align = 0 == i ? "left" : 1 == i ? "center" : "right", i = t.readByte(), this._valign = 0 == i ? "top" : 1 == i ? "middle" : "bottom", 
            this._fill = t.readByte(), this._shrinkOnly = t.readBool(), this._autoSize = t.readBool(), 
            this._showErrorSign = t.readBool(), this._content.playing = t.readBool(), this._content.frame = t.getInt32(), 
            t.readBool() && (this.color = t.readColorS()), this._content.fillMethod = t.readByte(), 
            0 != this._content.fillMethod && (this._content.fillOrigin = t.readByte(), this._content.fillClockwise = t.readBool(), 
            this._content.fillAmount = t.getFloat32()), this._url && this.loadContent();
        }
    }
    e._errorSignPool = new t.GObjectPool(), t.GLoader = e;
}(fgui), function(t) {
    t.GLoader3D = class extends t.GObject {
        constructor() {
            super(), this._frame = 0, this._playing = !0, this._url = "", this._fill = t.LoaderFillType.None, 
            this._align = t.AlignType.Left, this._verticalAlign = t.VertAlignType.Top, this._color = "#FFFFFF";
        }
        createDisplayObject() {
            super.createDisplayObject(), this._container = new Laya.Sprite(), this._displayObject.addChild(this._container);
        }
        dispose() {
            super.dispose();
        }
        get url() {
            return this._url;
        }
        set url(t) {
            this._url != t && (this._url = t, this.loadContent(), this.updateGear(7));
        }
        get icon() {
            return this._url;
        }
        set icon(t) {
            this.url = t;
        }
        get align() {
            return this._align;
        }
        set align(t) {
            this._align != t && (this._align = t, this.updateLayout());
        }
        get verticalAlign() {
            return this._verticalAlign;
        }
        set verticalAlign(t) {
            this._verticalAlign != t && (this._verticalAlign = t, this.updateLayout());
        }
        get fill() {
            return this._fill;
        }
        set fill(t) {
            this._fill != t && (this._fill = t, this.updateLayout());
        }
        get shrinkOnly() {
            return this._shrinkOnly;
        }
        set shrinkOnly(t) {
            this._shrinkOnly != t && (this._shrinkOnly = t, this.updateLayout());
        }
        get autoSize() {
            return this._autoSize;
        }
        set autoSize(t) {
            this._autoSize != t && (this._autoSize = t, this.updateLayout());
        }
        get playing() {
            return this._playing;
        }
        set playing(t) {
            this._playing != t && (this._playing = t, this.updateGear(5), this.onChange());
        }
        get frame() {
            return this._frame;
        }
        set frame(t) {
            this._frame != t && (this._frame = t, this.updateGear(5), this.onChange());
        }
        get animationName() {
            return this._animationName;
        }
        set animationName(t) {
            this._animationName != t && (this._animationName = t, this.onChange());
        }
        get skinName() {
            return this._skinName;
        }
        set skinName(t) {
            this._skinName != t && (this._skinName = t, this.onChange());
        }
        get loop() {
            return this._loop;
        }
        set loop(t) {
            this._loop != t && (this._loop = t, this.onChange());
        }
        get color() {
            return this._color;
        }
        set color(e) {
            this._color != e && (this._color = e, this.updateGear(4), this._content && t.ToolSet.setColorFilter(this._content, this._color));
        }
        get content() {}
        loadContent() {
            this.clearContent(), this._url && (t.ToolSet.startsWith(this._url, "ui://") ? this.loadFromPackage(this._url) : this.loadExternal());
        }
        loadFromPackage(e) {
            this._contentItem = t.UIPackage.getItemByURL(e), this._contentItem && (this._contentItem = this._contentItem.getBranch(), 
            this.sourceWidth = this._contentItem.width, this.sourceHeight = this._contentItem.height, 
            this._contentItem = this._contentItem.getHighResolution(), this._autoSize && this.setSize(this.sourceWidth, this.sourceHeight), 
            this._contentItem.type != t.PackageItemType.Spine && this._contentItem.type != t.PackageItemType.DragonBones || this._contentItem.owner.getItemAssetAsync(this._contentItem, this.onLoaded.bind(this)));
        }
        onLoaded(t, e) {
            this._contentItem == e && (t && console.warn(t), this._contentItem.templet && this.setSkeleton(this._contentItem.templet.buildArmature(1), this._contentItem.skeletonAnchor));
        }
        setSkeleton(e, i) {
            this.url = null, this._content = e, this._container.addChild(this._content), this._content.pos(i.x, i.y), 
            t.ToolSet.setColorFilter(this._content, this._color), this.onChange(), this.updateLayout();
        }
        onChange() {
            this._content && (this._animationName ? this._playing ? this._content.play(this._animationName, this._loop) : this._content.play(this._animationName, !1, !0, this._frame, this._frame) : this._content.stop(), 
            this._skinName ? this._content.showSkinByName(this._skinName) : this._content.showSkinByIndex(0));
        }
        loadExternal() {}
        updateLayout() {
            let e = this.sourceWidth, i = this.sourceHeight;
            if (this._autoSize && (this._updatingLayout = !0, 0 == e && (e = 50), 0 == i && (i = 30), 
            this.setSize(e, i), this._updatingLayout = !1, e == this._width && i == this._height)) return this._container.scale(1, 1), 
            void this._container.pos(0, 0);
            var s, h, r = 1, a = 1;
            this._fill != t.LoaderFillType.None && (r = this.width / this.sourceWidth, a = this.height / this.sourceHeight, 
            1 == r && 1 == a || (this._fill == t.LoaderFillType.ScaleMatchHeight ? r = a : this._fill == t.LoaderFillType.ScaleMatchWidth ? a = r : this._fill == t.LoaderFillType.Scale ? r > a ? r = a : a = r : this._fill == t.LoaderFillType.ScaleNoBorder && (r > a ? a = r : r = a), 
            this._shrinkOnly && (r > 1 && (r = 1), a > 1 && (a = 1)), e = this.sourceWidth * r, 
            i = this.sourceHeight * a)), this._container.scale(r, a), s = this._align == t.AlignType.Center ? Math.floor((this.width - e) / 2) : this._align == t.AlignType.Right ? this.width - e : 0, 
            h = this._verticalAlign == t.VertAlignType.Middle ? Math.floor((this.height - i) / 2) : this._verticalAlign == t.VertAlignType.Bottom ? this.height - i : 0, 
            this._container.pos(s, h);
        }
        clearContent() {
            this._contentItem = null, this._content && (this._container.removeChild(this._content), 
            this._content.destroy(), this._content = null);
        }
        handleSizeChanged() {
            super.handleSizeChanged(), this._updatingLayout || this.updateLayout();
        }
        handleGrayedChanged() {}
        getProp(e) {
            switch (e) {
              case t.ObjectPropID.Color:
                return this.color;

              case t.ObjectPropID.Playing:
                return this.playing;

              case t.ObjectPropID.Frame:
                return this.frame;

              case t.ObjectPropID.TimeScale:
                return 1;

              default:
                return super.getProp(e);
            }
        }
        setProp(e, i) {
            switch (e) {
              case t.ObjectPropID.Color:
                this.color = i;
                break;

              case t.ObjectPropID.Playing:
                this.playing = i;
                break;

              case t.ObjectPropID.Frame:
                this.frame = i;
                break;

              case t.ObjectPropID.TimeScale:
              case t.ObjectPropID.DeltaTime:
                break;

              default:
                super.setProp(e, i);
            }
        }
        setup_beforeAdd(t, e) {
            super.setup_beforeAdd(t, e), t.seek(e, 5), this._url = t.readS(), this._align = t.readByte(), 
            this._verticalAlign = t.readByte(), this._fill = t.readByte(), this._shrinkOnly = t.readBool(), 
            this._autoSize = t.readBool(), this._animationName = t.readS(), this._skinName = t.readS(), 
            this._playing = t.readBool(), this._frame = t.getInt32(), this._loop = t.readBool(), 
            t.readBool() && (this.color = t.readColorS()), this._url && this.loadContent();
        }
    };
}(fgui), function(t) {
    t.GMovieClip = class extends t.GObject {
        constructor() {
            super();
        }
        get color() {
            return this._movieClip.color;
        }
        set color(t) {
            this._movieClip.color = t;
        }
        createDisplayObject() {
            this._displayObject = this._movieClip = new t.MovieClip(), this._movieClip.mouseEnabled = !1, 
            this._displayObject.$owner = this;
        }
        get playing() {
            return this._movieClip.playing;
        }
        set playing(t) {
            this._movieClip.playing != t && (this._movieClip.playing = t, this.updateGear(5));
        }
        get frame() {
            return this._movieClip.frame;
        }
        set frame(t) {
            this._movieClip.frame != t && (this._movieClip.frame = t, this.updateGear(5));
        }
        get timeScale() {
            return this._movieClip.timeScale;
        }
        set timeScale(t) {
            this._movieClip.timeScale = t;
        }
        rewind() {
            this._movieClip.rewind();
        }
        syncStatus(t) {
            this._movieClip.syncStatus(t._movieClip);
        }
        advance(t) {
            this._movieClip.advance(t);
        }
        setPlaySettings(t, e, i, s, h) {
            this._movieClip.setPlaySettings(t, e, i, s, h);
        }
        getProp(e) {
            switch (e) {
              case t.ObjectPropID.Color:
                return this.color;

              case t.ObjectPropID.Playing:
                return this.playing;

              case t.ObjectPropID.Frame:
                return this.frame;

              case t.ObjectPropID.TimeScale:
                return this.timeScale;

              default:
                return super.getProp(e);
            }
        }
        setProp(e, i) {
            switch (e) {
              case t.ObjectPropID.Color:
                this.color = i;
                break;

              case t.ObjectPropID.Playing:
                this.playing = i;
                break;

              case t.ObjectPropID.Frame:
                this.frame = i;
                break;

              case t.ObjectPropID.TimeScale:
                this.timeScale = i;
                break;

              case t.ObjectPropID.DeltaTime:
                this.advance(i);
                break;

              default:
                super.setProp(e, i);
            }
        }
        constructFromResource() {
            var t = this.packageItem.getBranch();
            this.sourceWidth = t.width, this.sourceHeight = t.height, this.initWidth = this.sourceWidth, 
            this.initHeight = this.sourceHeight, this.setSize(this.sourceWidth, this.sourceHeight), 
            (t = t.getHighResolution()).load(), this._movieClip.interval = t.interval, this._movieClip.swing = t.swing, 
            this._movieClip.repeatDelay = t.repeatDelay, this._movieClip.frames = t.frames;
        }
        setup_beforeAdd(t, e) {
            super.setup_beforeAdd(t, e), t.seek(e, 5), t.readBool() && (this.color = t.readColorS()), 
            t.readByte(), this._movieClip.frame = t.getInt32(), this._movieClip.playing = t.readBool();
        }
    };
}(fgui), function(t) {
    t.GProgressBar = class extends t.GComponent {
        constructor() {
            super(), this._min = 0, this._max = 0, this._value = 0, this._barMaxWidth = 0, this._barMaxHeight = 0, 
            this._barMaxWidthDelta = 0, this._barMaxHeightDelta = 0, this._barStartX = 0, this._barStartY = 0, 
            this._titleType = t.ProgressTitleType.Percent, this._value = 50, this._max = 100;
        }
        get titleType() {
            return this._titleType;
        }
        set titleType(t) {
            this._titleType != t && (this._titleType = t, this.update(t));
        }
        get min() {
            return this._min;
        }
        set min(t) {
            this._min != t && (this._min = t, this.update(this._value));
        }
        get max() {
            return this._max;
        }
        set max(t) {
            this._max != t && (this._max = t, this.update(this._value));
        }
        get value() {
            return this._value;
        }
        set value(e) {
            this._value != e && (t.GTween.kill(this, !1, this.update), this._value = e, this.update(e));
        }
        tweenValue(e, i) {
            var s, h = t.GTween.getTween(this, this.update);
            return h ? (s = h.value.x, h.kill()) : s = this._value, this._value = e, t.GTween.to(s, this._value, i).setTarget(this, this.update).setEase(t.EaseType.Linear);
        }
        update(e) {
            var i = t.ToolSet.clamp01((e - this._min) / (this._max - this._min));
            if (this._titleObject) switch (this._titleType) {
              case t.ProgressTitleType.Percent:
                this._titleObject.text = Math.floor(100 * i) + "%";
                break;

              case t.ProgressTitleType.ValueAndMax:
                this._titleObject.text = Math.floor(e) + "/" + Math.floor(this._max);
                break;

              case t.ProgressTitleType.Value:
                this._titleObject.text = "" + Math.floor(e);
                break;

              case t.ProgressTitleType.Max:
                this._titleObject.text = "" + Math.floor(this._max);
            }
            var s = this.width - this._barMaxWidthDelta, h = this.height - this._barMaxHeightDelta;
            this._reverse ? (this._barObjectH && (this.setFillAmount(this._barObjectH, 1 - i) || (this._barObjectH.width = Math.round(s * i), 
            this._barObjectH.x = this._barStartX + (s - this._barObjectH.width))), this._barObjectV && (this.setFillAmount(this._barObjectV, 1 - i) || (this._barObjectV.height = Math.round(h * i), 
            this._barObjectV.y = this._barStartY + (h - this._barObjectV.height)))) : (this._barObjectH && (this.setFillAmount(this._barObjectH, i) || (this._barObjectH.width = Math.round(s * i))), 
            this._barObjectV && (this.setFillAmount(this._barObjectV, i) || (this._barObjectV.height = Math.round(h * i)))), 
            this._aniObject && this._aniObject.setProp(t.ObjectPropID.Frame, Math.floor(100 * i));
        }
        setFillAmount(e, i) {
            return (e instanceof t.GImage || e instanceof t.GLoader) && e.fillMethod != t.FillMethod.None && (e.fillAmount = i, 
            !0);
        }
        constructExtension(t) {
            t.seek(0, 6), this._titleType = t.readByte(), this._reverse = t.readBool(), this._titleObject = this.getChild("title"), 
            this._barObjectH = this.getChild("bar"), this._barObjectV = this.getChild("bar_v"), 
            this._aniObject = this.getChild("ani"), this._barObjectH && (this._barMaxWidth = this._barObjectH.width, 
            this._barMaxWidthDelta = this.width - this._barMaxWidth, this._barStartX = this._barObjectH.x), 
            this._barObjectV && (this._barMaxHeight = this._barObjectV.height, this._barMaxHeightDelta = this.height - this._barMaxHeight, 
            this._barStartY = this._barObjectV.y);
        }
        handleSizeChanged() {
            super.handleSizeChanged(), this._barObjectH && (this._barMaxWidth = this.width - this._barMaxWidthDelta), 
            this._barObjectV && (this._barMaxHeight = this.height - this._barMaxHeightDelta), 
            this._underConstruct || this.update(this._value);
        }
        setup_afterAdd(t, e) {
            super.setup_afterAdd(t, e), t.seek(e, 6) && t.readByte() == this.packageItem.objectType ? (this._value = t.getInt32(), 
            this._max = t.getInt32(), t.version >= 2 && (this._min = t.getInt32()), this.update(this._value)) : this.update(this._value);
        }
    };
}(fgui), function(t) {
    t.GRichTextField = class extends t.GTextField {
        constructor() {
            super(), this._text = "";
        }
        createDisplayObject() {
            this._displayObject = this._div = new Laya.HTMLDivElement(), this._displayObject.mouseEnabled = !0, 
            this._displayObject.$owner = this;
        }
        get div() {
            return this._div;
        }
        set text(e) {
            this._text = e;
            var i = this._text;
            this._templateVars && (i = this.parseTemplate(i));
            try {
                if (this._ubbEnabled ? this._div.innerHTML = t.UBBParser.inst.parse(i) : this._div.innerHTML = i, 
                this._widthAutoSize || this._heightAutoSize) {
                    var s, h = 0;
                    this._widthAutoSize ? (s = this._div.contextWidth) > 0 && (s += 8) : s = this._width, 
                    h = this._heightAutoSize ? this._div.contextHeight : this._height, this._updatingSize = !0, 
                    this.setSize(s, h), this._updatingSize = !1;
                }
            } catch (t) {
                console.log("laya reports html error:" + t);
            }
        }
        get text() {
            return this._text;
        }
        get font() {
            return this._div.style.font;
        }
        set font(e) {
            this._div.style.font = e || t.UIConfig.defaultFont;
        }
        get fontSize() {
            return this._div.style.fontSize;
        }
        set fontSize(t) {
            this._div.style.fontSize = t;
        }
        get color() {
            return this._div.style.color;
        }
        set color(t) {
            this._div.style.color != t && (this._div.style.color = t, this.refresh(), this.updateGear(4));
        }
        get align() {
            return this._div.style.align;
        }
        set align(t) {
            this._div.style.align != t && (this._div.style.align = t, this.refresh());
        }
        get valign() {
            return this._div.style.valign;
        }
        set valign(t) {
            this._div.style.valign != t && (this._div.style.valign = t, this.refresh());
        }
        get leading() {
            return this._div.style.leading;
        }
        set leading(t) {
            this._div.style.leading != t && (this._div.style.leading = t, this.refresh());
        }
        get bold() {
            return this._div.style.bold;
        }
        set bold(t) {
            this._div.style.bold != t && (this._div.style.bold = t, this.refresh());
        }
        get italic() {
            return this._div.style.italic;
        }
        set italic(t) {
            this._div.style.italic != t && (this._div.style.italic = t, this.refresh());
        }
        get stroke() {
            return this._div.style.stroke;
        }
        set stroke(t) {
            this._div.style.stroke != t && (this._div.style.stroke = t, this.refresh());
        }
        get strokeColor() {
            return this._div.style.strokeColor;
        }
        set strokeColor(t) {
            this._div.style.strokeColor != t && (this._div.style.strokeColor = t, this.refresh(), 
            this.updateGear(4));
        }
        set ubbEnabled(t) {
            this._ubbEnabled = t;
        }
        get ubbEnabled() {
            return this._ubbEnabled;
        }
        get textWidth() {
            var t = this._div.contextWidth;
            return t > 0 && (t += 8), t;
        }
        refresh() {
            this._text.length > 0 && this._div._refresh && this._div._refresh();
        }
        updateAutoSize() {
            this._div.style.wordWrap = !this._widthAutoSize;
        }
        handleSizeChanged() {
            this._updatingSize || (this._div.size(this._width, this._height), this._div.style.width = this._width, 
            this._div.style.height = this._height);
        }
    };
}(fgui), function(t) {
    class e extends t.GComponent {
        constructor() {
            super(), e._inst || (e._inst = this), this.opaque = !1, this._popupStack = [], this._justClosedPopups = [], 
            this.displayObject.once(Laya.Event.DISPLAY, this, this.__addedToStage);
        }
        static get inst() {
            return e._inst || new e(), e._inst;
        }
        showWindow(t) {
            this.addChild(t), t.requestFocus(), t.x > this.width ? t.x = this.width - t.width : t.x + t.width < 0 && (t.x = 0), 
            t.y > this.height ? t.y = this.height - t.height : t.y + t.height < 0 && (t.y = 0), 
            this.adjustModalLayer();
        }
        hideWindow(t) {
            t.hide();
        }
        hideWindowImmediately(t) {
            t.parent == this && this.removeChild(t), this.adjustModalLayer();
        }
        bringToFront(e) {
            var i, s = this.numChildren;
            for (i = this._modalLayer.parent && !e.modal ? this.getChildIndex(this._modalLayer) - 1 : s - 1; i >= 0; i--) {
                var h = this.getChildAt(i);
                if (h == e) return;
                if (h instanceof t.Window) break;
            }
            i >= 0 && this.setChildIndex(e, i);
        }
        showModalWait(e) {
            null != t.UIConfig.globalModalWaiting && (null == this._modalWaitPane && (this._modalWaitPane = t.UIPackage.createObjectFromURL(t.UIConfig.globalModalWaiting)), 
            this._modalWaitPane.setSize(this.width, this.height), this._modalWaitPane.addRelation(this, t.RelationType.Size), 
            this.addChild(this._modalWaitPane), this._modalWaitPane.text = e);
        }
        closeModalWait() {
            this._modalWaitPane && this._modalWaitPane.parent && this.removeChild(this._modalWaitPane);
        }
        closeAllExceptModals() {
            for (var e = this._children.slice(), i = e.length, s = 0; s < i; s++) {
                var h = e[s];
                h instanceof t.Window && !h.modal && h.hide();
            }
        }
        closeAllWindows() {
            for (var e = this._children.slice(), i = e.length, s = 0; s < i; s++) {
                var h = e[s];
                h instanceof t.Window && h.hide();
            }
        }
        getTopWindow() {
            for (var e = this.numChildren - 1; e >= 0; e--) {
                var i = this.getChildAt(e);
                if (i instanceof t.Window) return i;
            }
            return null;
        }
        get modalLayer() {
            return this._modalLayer;
        }
        get hasModalWindow() {
            return null != this._modalLayer.parent;
        }
        get modalWaiting() {
            return this._modalWaitPane && this._modalWaitPane.inContainer;
        }
        showPopup(e, i, s) {
            if (this._popupStack.length > 0) {
                var h = this._popupStack.indexOf(e);
                if (-1 != h) for (var r = this._popupStack.length - 1; r >= h; r--) this.removeChild(this._popupStack.pop());
            }
            if (this._popupStack.push(e), i) for (var a = i; a; ) {
                if (a.parent == this) {
                    e.sortingOrder < a.sortingOrder && (e.sortingOrder = a.sortingOrder);
                    break;
                }
                a = a.parent;
            }
            var n;
            this.addChild(e), this.adjustModalLayer();
            var o, l, _ = 0, d = 0;
            i ? (n = i.localToGlobal(), _ = i.width, d = i.height) : n = this.globalToLocal(Laya.stage.mouseX, Laya.stage.mouseY), 
            (o = n.x) + e.width > this.width && (o = o + _ - e.width), l = n.y + d, ((void 0 === s || s === t.PopupDirection.Auto) && n.y + e.height > this.height || !1 === s || s === t.PopupDirection.Up) && (l = n.y - e.height - 1) < 0 && (l = 0, 
            o += _ / 2), e.x = o, e.y = l;
        }
        togglePopup(t, e, i) {
            -1 == this._justClosedPopups.indexOf(t) && this.showPopup(t, e, i);
        }
        hidePopup(t) {
            if (t) {
                var e = this._popupStack.indexOf(t);
                if (-1 != e) for (var i = this._popupStack.length - 1; i >= e; i--) this.closePopup(this._popupStack.pop());
            } else {
                for (i = this._popupStack.length - 1; i >= 0; i--) this.closePopup(this._popupStack[i]);
                this._popupStack.length = 0;
            }
        }
        get hasAnyPopup() {
            return 0 != this._popupStack.length;
        }
        closePopup(e) {
            e.parent && (e instanceof t.Window ? e.hide() : this.removeChild(e));
        }
        showTooltips(e) {
            if (null == this._defaultTooltipWin) {
                var i = t.UIConfig.tooltipsWin;
                if (!i) return void Laya.Log.print("UIConfig.tooltipsWin not defined");
                this._defaultTooltipWin = t.UIPackage.createObjectFromURL(i);
            }
            this._defaultTooltipWin.text = e, this.showTooltipsWin(this._defaultTooltipWin);
        }
        showTooltipsWin(t, e) {
            this.hideTooltips(), this._tooltipWin = t;
            var i = 0, s = 0;
            null == e ? (i = Laya.stage.mouseX + 10, s = Laya.stage.mouseY + 20) : (i = e.x, 
            s = e.y);
            var h = this.globalToLocal(i, s);
            i = h.x, s = h.y, i + this._tooltipWin.width > this.width && (i = i - this._tooltipWin.width - 1) < 0 && (i = 10), 
            s + this._tooltipWin.height > this.height && (s = s - this._tooltipWin.height - 1, 
            i - this._tooltipWin.width - 1 > 0 && (i = i - this._tooltipWin.width - 1), s < 0 && (s = 10)), 
            this._tooltipWin.x = i, this._tooltipWin.y = s, this.addChild(this._tooltipWin);
        }
        hideTooltips() {
            this._tooltipWin && (this._tooltipWin.parent && this.removeChild(this._tooltipWin), 
            this._tooltipWin = null);
        }
        get focus() {
            return null;
        }
        set focus(t) {
            this.setFocus(t);
        }
        setFocus(t) {}
        get volumeScale() {
            return Laya.SoundManager.soundVolume;
        }
        set volumeScale(t) {
            Laya.SoundManager.soundVolume = t;
        }
        playOneShotSound(e, i) {
            t.ToolSet.startsWith(e, "ui://") || Laya.SoundManager.playSound(e);
        }
        adjustModalLayer() {
            var e = this.numChildren;
            null != this._modalWaitPane && null != this._modalWaitPane.parent && this.setChildIndex(this._modalWaitPane, e - 1);
            for (var i = e - 1; i >= 0; i--) {
                var s = this.getChildAt(i);
                if (s instanceof t.Window && s.modal) return void (null == this._modalLayer.parent ? this.addChildAt(this._modalLayer, i) : this.setChildIndexBefore(this._modalLayer, i));
            }
            this._modalLayer.parent && this.removeChild(this._modalLayer);
        }
        __addedToStage() {
            Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.__stageMouseDown), Laya.stage.on(Laya.Event.MOUSE_UP, this, this.__stageMouseUp), 
            this._modalLayer = new t.GGraph(), this._modalLayer.setSize(this.width, this.height), 
            this._modalLayer.drawRect(0, null, t.UIConfig.modalLayerColor), this._modalLayer.addRelation(this, t.RelationType.Size), 
            this.displayObject.stage.on(Laya.Event.RESIZE, this, this.__winResize), this.__winResize();
        }
        checkPopups(t) {
            if (!this._checkPopups && (this._checkPopups = !0, this._justClosedPopups.length = 0, 
            this._popupStack.length > 0)) {
                for (var e = t; e != this.displayObject.stage && e; ) {
                    if (e.$owner) {
                        var i = this._popupStack.indexOf(e.$owner);
                        if (-1 != i) {
                            for (var s = this._popupStack.length - 1; s > i; s--) {
                                var h = this._popupStack.pop();
                                this.closePopup(h), this._justClosedPopups.push(h);
                            }
                            return;
                        }
                    }
                    e = e.parent;
                }
                for (s = this._popupStack.length - 1; s >= 0; s--) h = this._popupStack[s], this.closePopup(h), 
                this._justClosedPopups.push(h);
                this._popupStack.length = 0;
            }
        }
        __stageMouseDown(t) {
            this._tooltipWin && this.hideTooltips(), this.checkPopups(t.target);
        }
        __stageMouseUp() {
            this._checkPopups = !1;
        }
        __winResize() {
            this.setSize(Laya.stage.width, Laya.stage.height), this.updateContentScaleLevel();
        }
        updateContentScaleLevel() {
            var t = Laya.stage._canvasTransform, i = Math.max(t.getScaleX(), t.getScaleY());
            e.contentScaleLevel = i >= 3.5 ? 3 : i >= 2.5 ? 2 : i >= 1.5 ? 1 : 0;
        }
    }
    e.contentScaleLevel = 0, t.GRoot = e;
}(fgui), function(t) {
    t.GScrollBar = class extends t.GComponent {
        constructor() {
            super(), this._dragOffset = new Laya.Point(), this._scrollPerc = 0;
        }
        setScrollPane(t, e) {
            this._target = t, this._vertical = e;
        }
        setDisplayPerc(t) {
            this._vertical ? (this._fixedGripSize || (this._grip.height = Math.floor(t * this._bar.height)), 
            this._grip.y = this._bar.y + (this._bar.height - this._grip.height) * this._scrollPerc) : (this._fixedGripSize || (this._grip.width = Math.floor(t * this._bar.width)), 
            this._grip.x = this._bar.x + (this._bar.width - this._grip.width) * this._scrollPerc), 
            this._grip.visible = 0 != t && 1 != t;
        }
        setScrollPerc(t) {
            this._scrollPerc = t, this._vertical ? this._grip.y = this._bar.y + (this._bar.height - this._grip.height) * this._scrollPerc : this._grip.x = this._bar.x + (this._bar.width - this._grip.width) * this._scrollPerc;
        }
        get minSize() {
            return this._vertical ? (this._arrowButton1 ? this._arrowButton1.height : 0) + (this._arrowButton2 ? this._arrowButton2.height : 0) : (this._arrowButton1 ? this._arrowButton1.width : 0) + (this._arrowButton2 ? this._arrowButton2.width : 0);
        }
        get gripDragging() {
            return this._gripDragging;
        }
        constructExtension(t) {
            t.seek(0, 6), this._fixedGripSize = t.readBool(), this._grip = this.getChild("grip"), 
            this._grip ? (this._bar = this.getChild("bar"), this._bar ? (this._arrowButton1 = this.getChild("arrow1"), 
            this._arrowButton2 = this.getChild("arrow2"), this._grip.on(Laya.Event.MOUSE_DOWN, this, this.__gripMouseDown), 
            this._arrowButton1 && this._arrowButton1.on(Laya.Event.MOUSE_DOWN, this, this.__arrowButton1Click), 
            this._arrowButton2 && this._arrowButton2.on(Laya.Event.MOUSE_DOWN, this, this.__arrowButton2Click), 
            this.on(Laya.Event.MOUSE_DOWN, this, this.__barMouseDown)) : Laya.Log.print("需要定义bar")) : Laya.Log.print("需要定义grip");
        }
        __gripMouseDown(t) {
            t.stopPropagation(), this._gripDragging = !0, this._target.updateScrollBarVisible(), 
            Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.__gripMouseMove), Laya.stage.on(Laya.Event.MOUSE_UP, this, this.__gripMouseUp), 
            this.globalToLocal(Laya.stage.mouseX, Laya.stage.mouseY, this._dragOffset), this._dragOffset.x -= this._grip.x, 
            this._dragOffset.y -= this._grip.y;
        }
        __gripMouseMove() {
            if (this.onStage) {
                var t = this.globalToLocal(Laya.stage.mouseX, Laya.stage.mouseY, e);
                if (this._vertical) {
                    var i = t.y - this._dragOffset.y;
                    this._target.setPercY((i - this._bar.y) / (this._bar.height - this._grip.height), !1);
                } else {
                    var s = t.x - this._dragOffset.x;
                    this._target.setPercX((s - this._bar.x) / (this._bar.width - this._grip.width), !1);
                }
            }
        }
        __gripMouseUp(t) {
            this.onStage && (Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.__gripMouseMove), 
            Laya.stage.off(Laya.Event.MOUSE_UP, this, this.__gripMouseUp), this._gripDragging = !1, 
            this._target.updateScrollBarVisible());
        }
        __arrowButton1Click(t) {
            t.stopPropagation(), this._vertical ? this._target.scrollUp() : this._target.scrollLeft();
        }
        __arrowButton2Click(t) {
            t.stopPropagation(), this._vertical ? this._target.scrollDown() : this._target.scrollRight();
        }
        __barMouseDown(t) {
            var i = this._grip.globalToLocal(Laya.stage.mouseX, Laya.stage.mouseY, e);
            this._vertical ? i.y < 0 ? this._target.scrollUp(4) : this._target.scrollDown(4) : i.x < 0 ? this._target.scrollLeft(4) : this._target.scrollRight(4);
        }
    };
    var e = new Laya.Point();
}(fgui), function(t) {
    t.GSlider = class extends t.GComponent {
        constructor() {
            super(), this._min = 0, this._max = 0, this._value = 0, this._barMaxWidth = 0, this._barMaxHeight = 0, 
            this._barMaxWidthDelta = 0, this._barMaxHeightDelta = 0, this._clickPercent = 0, 
            this._barStartX = 0, this._barStartY = 0, this.changeOnClick = !0, this.canDrag = !0, 
            this._titleType = t.ProgressTitleType.Percent, this._value = 50, this._max = 100, 
            this._clickPos = new Laya.Point();
        }
        get titleType() {
            return this._titleType;
        }
        set titleType(t) {
            this._titleType = t;
        }
        get wholeNumbers() {
            return this._wholeNumbers;
        }
        set wholeNumbers(t) {
            this._wholeNumbers != t && (this._wholeNumbers = t, this.update());
        }
        get min() {
            return this._min;
        }
        set min(t) {
            this._min != t && (this._min = t, this.update());
        }
        get max() {
            return this._max;
        }
        set max(t) {
            this._max != t && (this._max = t, this.update());
        }
        get value() {
            return this._value;
        }
        set value(t) {
            this._value != t && (this._value = t, this.update());
        }
        update() {
            this.updateWithPercent((this._value - this._min) / (this._max - this._min));
        }
        updateWithPercent(e, i) {
            if (e = t.ToolSet.clamp01(e), i) {
                var s = t.ToolSet.clamp(this._min + (this._max - this._min) * e, this._min, this._max);
                this._wholeNumbers && (s = Math.round(s), e = t.ToolSet.clamp01((s - this._min) / (this._max - this._min))), 
                s != this._value && (this._value = s, t.Events.dispatch(t.Events.STATE_CHANGED, this.displayObject, i));
            }
            if (this._titleObject) switch (this._titleType) {
              case t.ProgressTitleType.Percent:
                this._titleObject.text = Math.floor(100 * e) + "%";
                break;

              case t.ProgressTitleType.ValueAndMax:
                this._titleObject.text = this._value + "/" + this._max;
                break;

              case t.ProgressTitleType.Value:
                this._titleObject.text = "" + this._value;
                break;

              case t.ProgressTitleType.Max:
                this._titleObject.text = "" + this._max;
            }
            var h = this.width - this._barMaxWidthDelta, r = this.height - this._barMaxHeightDelta;
            this._reverse ? (this._barObjectH && (this._barObjectH.width = Math.round(h * e), 
            this._barObjectH.x = this._barStartX + (h - this._barObjectH.width)), this._barObjectV && (this._barObjectV.height = Math.round(r * e), 
            this._barObjectV.y = this._barStartY + (r - this._barObjectV.height))) : (this._barObjectH && (this._barObjectH.width = Math.round(h * e)), 
            this._barObjectV && (this._barObjectV.height = Math.round(r * e)));
        }
        constructExtension(t) {
            t.seek(0, 6), this._titleType = t.readByte(), this._reverse = t.readBool(), t.version >= 2 && (this._wholeNumbers = t.readBool(), 
            this.changeOnClick = t.readBool()), this._titleObject = this.getChild("title"), 
            this._barObjectH = this.getChild("bar"), this._barObjectV = this.getChild("bar_v"), 
            this._gripObject = this.getChild("grip"), this._barObjectH && (this._barMaxWidth = this._barObjectH.width, 
            this._barMaxWidthDelta = this.width - this._barMaxWidth, this._barStartX = this._barObjectH.x), 
            this._barObjectV && (this._barMaxHeight = this._barObjectV.height, this._barMaxHeightDelta = this.height - this._barMaxHeight, 
            this._barStartY = this._barObjectV.y), this._gripObject && this._gripObject.on(Laya.Event.MOUSE_DOWN, this, this.__gripMouseDown), 
            this.displayObject.on(Laya.Event.MOUSE_DOWN, this, this.__barMouseDown);
        }
        handleSizeChanged() {
            super.handleSizeChanged(), this._barObjectH && (this._barMaxWidth = this.width - this._barMaxWidthDelta), 
            this._barObjectV && (this._barMaxHeight = this.height - this._barMaxHeightDelta), 
            this._underConstruct || this.update();
        }
        setup_afterAdd(t, e) {
            super.setup_afterAdd(t, e), t.seek(e, 6) && t.readByte() == this.packageItem.objectType ? (this._value = t.getInt32(), 
            this._max = t.getInt32(), t.version >= 2 && (this._min = t.getInt32()), this.update()) : this.update();
        }
        __gripMouseDown(e) {
            this.canDrag = !0, e.stopPropagation(), this._clickPos = this.globalToLocal(Laya.stage.mouseX, Laya.stage.mouseY), 
            this._clickPercent = t.ToolSet.clamp01((this._value - this._min) / (this._max - this._min)), 
            Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.__gripMouseMove), Laya.stage.on(Laya.Event.MOUSE_UP, this, this.__gripMouseUp);
        }
        __gripMouseMove(t) {
            if (this.canDrag) {
                var i, s = this.globalToLocal(Laya.stage.mouseX, Laya.stage.mouseY, e), h = s.x - this._clickPos.x, r = s.y - this._clickPos.y;
                this._reverse && (h = -h, r = -r), i = this._barObjectH ? this._clickPercent + h / this._barMaxWidth : this._clickPercent + r / this._barMaxHeight, 
                this.updateWithPercent(i, t);
            }
        }
        __gripMouseUp(t) {
            Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.__gripMouseMove), Laya.stage.off(Laya.Event.MOUSE_UP, this, this.__gripMouseUp);
        }
        __barMouseDown(i) {
            if (this.changeOnClick) {
                var s, h = this._gripObject.globalToLocal(i.stageX, i.stageY, e), r = t.ToolSet.clamp01((this._value - this._min) / (this._max - this._min));
                this._barObjectH && (s = h.x / this._barMaxWidth), this._barObjectV && (s = h.y / this._barMaxHeight), 
                this._reverse ? r -= s : r += s, this.updateWithPercent(r, i);
            }
        }
    };
    var e = new Laya.Point();
}(fgui), function(t) {
    t.GTextInput = class extends t.GTextField {
        constructor() {
            super();
        }
        createDisplayObject() {
            this._displayObject = this._input = new Laya.Input(), this._displayObject.mouseEnabled = !0, 
            this._displayObject.$owner = this;
        }
        get nativeInput() {
            return this._input;
        }
        set text(t) {
            this._input.text = t;
        }
        get text() {
            return this._input.text;
        }
        get font() {
            return this._input.font;
        }
        set font(e) {
            this._input.font = e || t.UIConfig.defaultFont;
        }
        get fontSize() {
            return this._input.fontSize;
        }
        set fontSize(t) {
            this._input.fontSize = t;
        }
        get color() {
            return this._input.color;
        }
        set color(t) {
            this._input.color = t;
        }
        get align() {
            return this._input.align;
        }
        set align(t) {
            this._input.align = t;
        }
        get valign() {
            return this._input.valign;
        }
        set valign(t) {
            this._input.valign = t;
        }
        get leading() {
            return this._input.leading;
        }
        set leading(t) {
            this._input.leading = t;
        }
        get bold() {
            return this._input.bold;
        }
        set bold(t) {
            this._input.bold = t;
        }
        get italic() {
            return this._input.italic;
        }
        set italic(t) {
            this._input.italic = t;
        }
        get singleLine() {
            return !this._input.multiline;
        }
        set singleLine(t) {
            this._input.multiline = !t;
        }
        get stroke() {
            return this._input.stroke;
        }
        set stroke(t) {
            this._input.stroke = t;
        }
        get strokeColor() {
            return this._input.strokeColor;
        }
        set strokeColor(t) {
            this._input.strokeColor = t, this.updateGear(4);
        }
        get password() {
            return "password" == this._input.type;
        }
        set password(t) {
            this._input.type = t ? "password" : "text";
        }
        get keyboardType() {
            return this._input.type;
        }
        set keyboardType(t) {
            this._input.type = t;
        }
        set editable(t) {
            this._input.editable = t;
        }
        get editable() {
            return this._input.editable;
        }
        set maxLength(t) {
            this._input.maxChars = t;
        }
        get maxLength() {
            return this._input.maxChars;
        }
        set promptText(e) {
            this._prompt = e;
            var i = t.UBBParser.inst.parse(e, !0);
            this._input.prompt = i, t.UBBParser.inst.lastColor && (this._input.promptColor = t.UBBParser.inst.lastColor);
        }
        get promptText() {
            return this._prompt;
        }
        set restrict(t) {
            this._input.restrict = t;
        }
        get restrict() {
            return this._input.restrict;
        }
        get textWidth() {
            return this._input.textWidth;
        }
        requestFocus() {
            this._input.focus = !0, super.requestFocus();
        }
        handleSizeChanged() {
            this._input.size(this._width, this._height);
        }
        setup_beforeAdd(t, e) {
            super.setup_beforeAdd(t, e), t.seek(e, 4);
            var i = t.readS();
            null != i && (this.promptText = i), null != (i = t.readS()) && (this._input.restrict = i);
            var s = t.getInt32();
            0 != s && (this._input.maxChars = s), 0 != (s = t.getInt32()) && (4 == s ? this.keyboardType = Laya.Input.TYPE_NUMBER : 3 == s && (this.keyboardType = Laya.Input.TYPE_URL)), 
            t.readBool() && (this.password = !0);
        }
    };
}(fgui), function(t) {
    t.GTree = class extends t.GList {
        constructor() {
            super(), this._indent = 15, this._rootNode = new t.GTreeNode(!0), this._rootNode._setTree(this), 
            this._rootNode.expanded = !0;
        }
        get rootNode() {
            return this._rootNode;
        }
        get indent() {
            return this._indent;
        }
        set indent(t) {
            this._indent = t;
        }
        get clickToExpand() {
            return this._clickToExpand;
        }
        set clickToExpand(t) {
            this._clickToExpand = t;
        }
        getSelectedNode() {
            return -1 != this.selectedIndex ? this.getChildAt(this.selectedIndex)._treeNode : null;
        }
        getSelectedNodes(t) {
            t || (t = new Array()), e.length = 0, super.getSelection(e);
            for (var i = e.length, s = new Array(), h = 0; h < i; h++) {
                var r = this.getChildAt(e[h])._treeNode;
                s.push(r);
            }
            return s;
        }
        selectNode(t, e) {
            for (var i = t.parent; i && i != this._rootNode; ) i.expanded = !0, i = i.parent;
            t._cell && this.addSelection(this.getChildIndex(t._cell), e);
        }
        unselectNode(t) {
            t._cell && this.removeSelection(this.getChildIndex(t._cell));
        }
        expandAll(t) {
            t || (t = this._rootNode), t.expanded = !0;
            for (var e = t.numChildren, i = 0; i < e; i++) {
                var s = t.getChildAt(i);
                s.isFolder && this.expandAll(s);
            }
        }
        collapseAll(t) {
            t || (t = this._rootNode), t != this._rootNode && (t.expanded = !1);
            for (var e = t.numChildren, i = 0; i < e; i++) {
                var s = t.getChildAt(i);
                s.isFolder && this.collapseAll(s);
            }
        }
        createCell(e) {
            var i = this.getFromPool(e._resURL ? e._resURL : this.defaultItem);
            if (!i) throw new Error("cannot create tree node object.");
            i._treeNode = e, e._cell = i;
            var s, h = i.getChild("indent");
            h && (h.width = (e.level - 1) * this._indent), (s = i.getController("expanded")) && (s.on(t.Events.STATE_CHANGED, this, this.__expandedStateChanged), 
            s.selectedIndex = e.expanded ? 1 : 0), (s = i.getController("leaf")) && (s.selectedIndex = e.isFolder ? 0 : 1), 
            e.isFolder && i.on(Laya.Event.MOUSE_DOWN, this, this.__cellMouseDown), this.treeNodeRender && this.treeNodeRender.runWith([ e, i ]);
        }
        _afterInserted(t) {
            t._cell || this.createCell(t);
            var e = this.getInsertIndexForNode(t);
            this.addChildAt(t._cell, e), this.treeNodeRender && this.treeNodeRender.runWith([ t, t._cell ]), 
            t.isFolder && t.expanded && this.checkChildren(t, e);
        }
        getInsertIndexForNode(t) {
            var e = t.getPrevSibling();
            e || (e = t.parent);
            for (var i = this.getChildIndex(e._cell) + 1, s = t.level, h = this.numChildren, r = i; r < h && !(this.getChildAt(r)._treeNode.level <= s); r++) i++;
            return i;
        }
        _afterRemoved(t) {
            this.removeNode(t);
        }
        _afterExpanded(t) {
            if (t != this._rootNode) {
                if (null != this.treeNodeWillExpand && this.treeNodeWillExpand.runWith([ t, !0 ]), 
                t._cell) {
                    this.treeNodeRender && this.treeNodeRender.runWith([ t, t._cell ]);
                    var e = t._cell.getController("expanded");
                    e && (e.selectedIndex = 1), t._cell.parent && this.checkChildren(t, this.getChildIndex(t._cell));
                }
            } else this.checkChildren(this._rootNode, 0);
        }
        _afterCollapsed(t) {
            if (t != this._rootNode) {
                if (this.treeNodeWillExpand && this.treeNodeWillExpand.runWith([ t, !1 ]), t._cell) {
                    this.treeNodeRender && this.treeNodeRender.runWith([ t, t._cell ]);
                    var e = t._cell.getController("expanded");
                    e && (e.selectedIndex = 0), t._cell.parent && this.hideFolderNode(t);
                }
            } else this.checkChildren(this._rootNode, 0);
        }
        _afterMoved(t) {
            var e, i = this.getChildIndex(t._cell);
            e = t.isFolder ? this.getFolderEndIndex(i, t.level) : i + 1;
            var s, h, r = this.getInsertIndexForNode(t), a = e - i;
            if (r < i) for (s = 0; s < a; s++) h = this.getChildAt(i + s), this.setChildIndex(h, r + s); else for (s = 0; s < a; s++) h = this.getChildAt(i), 
            this.setChildIndex(h, r);
        }
        getFolderEndIndex(t, e) {
            for (var i = this.numChildren, s = t + 1; s < i; s++) if (this.getChildAt(s)._treeNode.level <= e) return s;
            return i;
        }
        checkChildren(t, e) {
            for (var i = t.numChildren, s = 0; s < i; s++) {
                e++;
                var h = t.getChildAt(s);
                h._cell || this.createCell(h), h._cell.parent || this.addChildAt(h._cell, e), h.isFolder && h.expanded && (e = this.checkChildren(h, e));
            }
            return e;
        }
        hideFolderNode(t) {
            for (var e = t.numChildren, i = 0; i < e; i++) {
                var s = t.getChildAt(i);
                s._cell && this.removeChild(s._cell), s.isFolder && s.expanded && this.hideFolderNode(s);
            }
        }
        removeNode(t) {
            if (t._cell && (t._cell.parent && this.removeChild(t._cell), this.returnToPool(t._cell), 
            t._cell._treeNode = null, t._cell = null), t.isFolder) for (var e = t.numChildren, i = 0; i < e; i++) {
                var s = t.getChildAt(i);
                this.removeNode(s);
            }
        }
        __cellMouseDown(e) {
            var i = t.GObject.cast(e.currentTarget)._treeNode;
            this._expandedStatusInEvt = i.expanded;
        }
        __expandedStateChanged(t) {
            t.parent._treeNode.expanded = 1 == t.selectedIndex;
        }
        dispatchItemEvent(t, e) {
            if (0 != this._clickToExpand) {
                var i = t._treeNode;
                i && i.isFolder && this._expandedStatusInEvt == i.expanded && (2 == this._clickToExpand || (i.expanded = !i.expanded));
            }
            super.dispatchItemEvent(t, e);
        }
        setup_beforeAdd(t, e) {
            super.setup_beforeAdd(t, e), t.seek(e, 9), this._indent = t.getInt32(), this._clickToExpand = t.getUint8();
        }
        readItems(e) {
            var i, s, h, r, a, n, o, l = 0;
            for (i = e.getInt16(), s = 0; s < i; s++) if (h = e.getInt16(), h += e.pos, null != (r = e.readS()) || (r = this.defaultItem)) {
                a = e.readBool(), o = e.getUint8();
                var _ = new t.GTreeNode(a, r);
                if (_.expanded = !0, 0 == s) this._rootNode.addChild(_); else if (o > l) n.addChild(_); else if (o < l) {
                    for (var d = o; d <= l; d++) n = n.parent;
                    n.addChild(_);
                } else n.parent.addChild(_);
                n = _, l = o, this.setupItem(e, _.cell), e.pos = h;
            } else e.pos = h;
        }
    };
    var e = new Array();
}(fgui), function(t) {
    t.GTreeNode = class {
        constructor(t, e) {
            this._level = 0, this._resURL = e, t && (this._children = new Array());
        }
        set expanded(t) {
            null != this._children && this._expanded != t && (this._expanded = t, this._tree && (this._expanded ? this._tree._afterExpanded(this) : this._tree._afterCollapsed(this)));
        }
        get expanded() {
            return this._expanded;
        }
        get isFolder() {
            return null != this._children;
        }
        get parent() {
            return this._parent;
        }
        get text() {
            return this._cell ? this._cell.text : null;
        }
        set text(t) {
            this._cell && (this._cell.text = t);
        }
        get icon() {
            return this._cell ? this._cell.icon : null;
        }
        set icon(t) {
            this._cell && (this._cell.icon = t);
        }
        get cell() {
            return this._cell;
        }
        get level() {
            return this._level;
        }
        _setLevel(t) {
            this._level = t;
        }
        addChild(t) {
            return this.addChildAt(t, this._children.length), t;
        }
        addChildAt(t, e) {
            if (!t) throw new Error("child is null");
            var i = this._children.length;
            if (e >= 0 && e <= i) return t._parent == this ? this.setChildIndex(t, e) : (t._parent && t._parent.removeChild(t), 
            e == this._children.length ? this._children.push(t) : this._children.splice(e, 0, t), 
            t._parent = this, t._level = this._level + 1, t._setTree(this._tree), (this._tree && this == this._tree.rootNode || this._cell && this._cell.parent && this._expanded) && this._tree._afterInserted(t)), 
            t;
            throw new RangeError("Invalid child index");
        }
        removeChild(t) {
            var e = this._children.indexOf(t);
            return -1 != e && this.removeChildAt(e), t;
        }
        removeChildAt(t) {
            if (t >= 0 && t < this.numChildren) {
                var e = this._children[t];
                return this._children.splice(t, 1), e._parent = null, this._tree && (e._setTree(null), 
                this._tree._afterRemoved(e)), e;
            }
            throw "Invalid child index";
        }
        removeChildren(t, e) {
            t = t || 0, null == e && (e = -1), (e < 0 || e >= this.numChildren) && (e = this.numChildren - 1);
            for (var i = t; i <= e; ++i) this.removeChildAt(t);
        }
        getChildAt(t) {
            if (t >= 0 && t < this.numChildren) return this._children[t];
            throw "Invalid child index";
        }
        getChildIndex(t) {
            return this._children.indexOf(t);
        }
        getPrevSibling() {
            if (null == this._parent) return null;
            var t = this._parent._children.indexOf(this);
            return t <= 0 ? null : this._parent._children[t - 1];
        }
        getNextSibling() {
            if (null == this._parent) return null;
            var t = this._parent._children.indexOf(this);
            return t < 0 || t >= this._parent._children.length - 1 ? null : this._parent._children[t + 1];
        }
        setChildIndex(t, e) {
            var i = this._children.indexOf(t);
            if (-1 == i) throw "Not a child of this container";
            var s = this._children.length;
            e < 0 ? e = 0 : e > s && (e = s), i != e && (this._children.splice(i, 1), this._children.splice(e, 0, t), 
            (this._tree && this == this._tree.rootNode || this._cell && this._cell.parent && this._expanded) && this._tree._afterMoved(t));
        }
        swapChildren(t, e) {
            var i = this._children.indexOf(t), s = this._children.indexOf(e);
            if (-1 == i || -1 == s) throw "Not a child of this container";
            this.swapChildrenAt(i, s);
        }
        swapChildrenAt(t, e) {
            var i = this._children[t], s = this._children[e];
            this.setChildIndex(i, e), this.setChildIndex(s, t);
        }
        get numChildren() {
            return this._children.length;
        }
        expandToRoot() {
            for (var t = this; t; ) t.expanded = !0, t = t.parent;
        }
        get tree() {
            return this._tree;
        }
        _setTree(t) {
            if (this._tree = t, this._tree && this._tree.treeNodeWillExpand && this._expanded && this._tree.treeNodeWillExpand.runWith([ this, !0 ]), 
            this._children) for (var e = this._children.length, i = 0; i < e; i++) {
                var s = this._children[i];
                s._level = this._level + 1, s._setTree(t);
            }
        }
    };
}(fgui), function(t) {
    t.PackageItem = class {
        constructor() {
            this.width = 0, this.height = 0;
        }
        load() {
            return this.owner.getItemAsset(this);
        }
        getBranch() {
            if (this.branches && -1 != this.owner._branchIndex) {
                var t = this.branches[this.owner._branchIndex];
                if (t) return this.owner.getItemById(t);
            }
            return this;
        }
        getHighResolution() {
            if (this.highResolution && t.GRoot.contentScaleLevel > 0) {
                var e = this.highResolution[t.GRoot.contentScaleLevel - 1];
                if (e) return this.owner.getItemById(e);
            }
            return this;
        }
        toString() {
            return this.name;
        }
    };
}(fgui), function(t) {
    t.PopupMenu = class {
        constructor(e) {
            if (!e && !(e = t.UIConfig.popupMenu)) throw "UIConfig.popupMenu not defined";
            this._contentPane = t.UIPackage.createObjectFromURL(e).asCom, this._contentPane.on(Laya.Event.DISPLAY, this, this.__addedToStage), 
            this._list = this._contentPane.getChild("list"), this._list.removeChildrenToPool(), 
            this._list.addRelation(this._contentPane, t.RelationType.Width), this._list.removeRelation(this._contentPane, t.RelationType.Height), 
            this._contentPane.addRelation(this._list, t.RelationType.Height), this._list.on(t.Events.CLICK_ITEM, this, this.__clickItem);
        }
        dispose() {
            this._contentPane.dispose();
        }
        addItem(t, e) {
            var i = this._list.addItemFromPool().asButton;
            i.title = t, i.data = e, i.grayed = !1;
            var s = i.getController("checked");
            return s && (s.selectedIndex = 0), i;
        }
        addItemAt(t, e, i) {
            var s = this._list.getFromPool().asButton;
            this._list.addChildAt(s, e), s.title = t, s.data = i, s.grayed = !1;
            var h = s.getController("checked");
            return h && (h.selectedIndex = 0), s;
        }
        addSeperator() {
            if (null == t.UIConfig.popupMenu_seperator) throw "UIConfig.popupMenu_seperator not defined";
            this.list.addItemFromPool(t.UIConfig.popupMenu_seperator);
        }
        getItemName(t) {
            return this._list.getChildAt(t).name;
        }
        setItemText(t, e) {
            this._list.getChild(t).asButton.title = e;
        }
        setItemVisible(t, e) {
            var i = this._list.getChild(t).asButton;
            i.visible != e && (i.visible = e, this._list.setBoundsChangedFlag());
        }
        setItemGrayed(t, e) {
            this._list.getChild(t).asButton.grayed = e;
        }
        setItemCheckable(t, e) {
            var i = this._list.getChild(t).asButton.getController("checked");
            i && (e ? 0 == i.selectedIndex && (i.selectedIndex = 1) : i.selectedIndex = 0);
        }
        setItemChecked(t, e) {
            var i = this._list.getChild(t).asButton.getController("checked");
            i && (i.selectedIndex = e ? 2 : 1);
        }
        isItemChecked(t) {
            var e = this._list.getChild(t).asButton.getController("checked");
            return !!e && 2 == e.selectedIndex;
        }
        removeItem(t) {
            var e = this._list.getChild(t);
            if (e) {
                var i = this._list.getChildIndex(e);
                return this._list.removeChildToPoolAt(i), !0;
            }
            return !1;
        }
        clearItems() {
            this._list.removeChildrenToPool();
        }
        get itemCount() {
            return this._list.numChildren;
        }
        get contentPane() {
            return this._contentPane;
        }
        get list() {
            return this._list;
        }
        show(e = null, i) {
            (null != e ? e.root : t.GRoot.inst).showPopup(this.contentPane, e instanceof t.GRoot ? null : e, i);
        }
        __clickItem(t) {
            Laya.timer.once(100, this, this.__clickItem2, [ t ]);
        }
        __clickItem2(e) {
            if (e instanceof t.GButton) if (e.grayed) this._list.selectedIndex = -1; else {
                var i = e.asCom.getController("checked");
                i && 0 != i.selectedIndex && (1 == i.selectedIndex ? i.selectedIndex = 2 : i.selectedIndex = 1), 
                this._contentPane.parent.hidePopup(this.contentPane), null != e.data && e.data.run();
            }
        }
        __addedToStage() {
            this._list.selectedIndex = -1, this._list.resizeToFit(1e5, 10);
        }
    };
}(fgui), function(t) {
    t.RelationItem = class {
        constructor(t) {
            this._owner = t, this._defs = new Array();
        }
        get owner() {
            return this._owner;
        }
        set target(t) {
            this._target != t && (this._target && this.releaseRefTarget(), this._target = t, 
            this._target && this.addRefTarget());
        }
        get target() {
            return this._target;
        }
        add(e, i) {
            if (e == t.RelationType.Size) return this.add(t.RelationType.Width, i), void this.add(t.RelationType.Height, i);
            for (var s = this._defs.length, h = 0; h < s; h++) if (this._defs[h].type == e) return;
            this.internalAdd(e, i);
        }
        internalAdd(i, s) {
            if (i == t.RelationType.Size) return this.internalAdd(t.RelationType.Width, s), 
            void this.internalAdd(t.RelationType.Height, s);
            var h = new e();
            h.percent = s, h.type = i, h.axis = i <= t.RelationType.Right_Right || i == t.RelationType.Width || i >= t.RelationType.LeftExt_Left && i <= t.RelationType.RightExt_Right ? 0 : 1, 
            this._defs.push(h);
        }
        remove(e) {
            if (e == t.RelationType.Size) return this.remove(t.RelationType.Width), void this.remove(t.RelationType.Height);
            for (var i = this._defs.length, s = 0; s < i; s++) if (this._defs[s].type == e) {
                this._defs.splice(s, 1);
                break;
            }
        }
        copyFrom(t) {
            this._target = t.target, this._defs.length = 0;
            for (var i = t._defs.length, s = 0; s < i; s++) {
                var h = t._defs[s], r = new e();
                r.copyFrom(h), this._defs.push(r);
            }
        }
        dispose() {
            this._target && (this.releaseRefTarget(), this._target = null);
        }
        get isEmpty() {
            return 0 == this._defs.length;
        }
        applyOnSelfResized(e, i, s) {
            var h = this._defs.length;
            if (0 != h) {
                for (var r = this._owner.x, a = this._owner.y, n = 0; n < h; n++) switch (this._defs[n].type) {
                  case t.RelationType.Center_Center:
                    this._owner.x -= (.5 - (s ? this._owner.pivotX : 0)) * e;
                    break;

                  case t.RelationType.Right_Center:
                  case t.RelationType.Right_Left:
                  case t.RelationType.Right_Right:
                    this._owner.x -= (1 - (s ? this._owner.pivotX : 0)) * e;
                    break;

                  case t.RelationType.Middle_Middle:
                    this._owner.y -= (.5 - (s ? this._owner.pivotY : 0)) * i;
                    break;

                  case t.RelationType.Bottom_Middle:
                  case t.RelationType.Bottom_Top:
                  case t.RelationType.Bottom_Bottom:
                    this._owner.y -= (1 - (s ? this._owner.pivotY : 0)) * i;
                }
                if ((r != this._owner.x || a != this._owner.y) && (r = this._owner.x - r, a = this._owner.y - a, 
                this._owner.updateGearFromRelations(1, r, a), this._owner.parent && this._owner.parent._transitions.length > 0)) {
                    h = this._owner.parent._transitions.length;
                    for (var o = 0; o < h; o++) this._owner.parent._transitions[o].updateFromRelations(this._owner.id, r, a);
                }
            }
        }
        applyOnXYChanged(e, i, s) {
            var h;
            switch (e.type) {
              case t.RelationType.Left_Left:
              case t.RelationType.Left_Center:
              case t.RelationType.Left_Right:
              case t.RelationType.Center_Center:
              case t.RelationType.Right_Left:
              case t.RelationType.Right_Center:
              case t.RelationType.Right_Right:
                this._owner.x += i;
                break;

              case t.RelationType.Top_Top:
              case t.RelationType.Top_Middle:
              case t.RelationType.Top_Bottom:
              case t.RelationType.Middle_Middle:
              case t.RelationType.Bottom_Top:
              case t.RelationType.Bottom_Middle:
              case t.RelationType.Bottom_Bottom:
                this._owner.y += s;
                break;

              case t.RelationType.Width:
              case t.RelationType.Height:
                break;

              case t.RelationType.LeftExt_Left:
              case t.RelationType.LeftExt_Right:
                this._owner != this._target.parent ? (h = this._owner.xMin, this._owner.width = this._owner._rawWidth - i, 
                this._owner.xMin = h + i) : this._owner.width = this._owner._rawWidth - i;
                break;

              case t.RelationType.RightExt_Left:
              case t.RelationType.RightExt_Right:
                this._owner != this._target.parent ? (h = this._owner.xMin, this._owner.width = this._owner._rawWidth + i, 
                this._owner.xMin = h) : this._owner.width = this._owner._rawWidth + i;
                break;

              case t.RelationType.TopExt_Top:
              case t.RelationType.TopExt_Bottom:
                this._owner != this._target.parent ? (h = this._owner.yMin, this._owner.height = this._owner._rawHeight - s, 
                this._owner.yMin = h + s) : this._owner.height = this._owner._rawHeight - s;
                break;

              case t.RelationType.BottomExt_Top:
              case t.RelationType.BottomExt_Bottom:
                this._owner != this._target.parent ? (h = this._owner.yMin, this._owner.height = this._owner._rawHeight + s, 
                this._owner.yMin = h) : this._owner.height = this._owner._rawHeight + s;
            }
        }
        applyOnSizeChanged(e) {
            var i, s, h = 0, r = 0, a = 0;
            switch (0 == e.axis ? (this._target != this._owner.parent && (h = this._target.x, 
            this._target.pivotAsAnchor && (r = this._target.pivotX)), e.percent ? 0 != this._targetWidth && (a = this._target._width / this._targetWidth) : a = this._target._width - this._targetWidth) : (this._target != this._owner.parent && (h = this._target.y, 
            this._target.pivotAsAnchor && (r = this._target.pivotY)), e.percent ? 0 != this._targetHeight && (a = this._target._height / this._targetHeight) : a = this._target._height - this._targetHeight), 
            e.type) {
              case t.RelationType.Left_Left:
                e.percent ? this._owner.xMin = h + (this._owner.xMin - h) * a : 0 != r && (this._owner.x += a * -r);
                break;

              case t.RelationType.Left_Center:
                e.percent ? this._owner.xMin = h + (this._owner.xMin - h) * a : this._owner.x += a * (.5 - r);
                break;

              case t.RelationType.Left_Right:
                e.percent ? this._owner.xMin = h + (this._owner.xMin - h) * a : this._owner.x += a * (1 - r);
                break;

              case t.RelationType.Center_Center:
                e.percent ? this._owner.xMin = h + (this._owner.xMin + .5 * this._owner._rawWidth - h) * a - .5 * this._owner._rawWidth : this._owner.x += a * (.5 - r);
                break;

              case t.RelationType.Right_Left:
                e.percent ? this._owner.xMin = h + (this._owner.xMin + this._owner._rawWidth - h) * a - this._owner._rawWidth : 0 != r && (this._owner.x += a * -r);
                break;

              case t.RelationType.Right_Center:
                e.percent ? this._owner.xMin = h + (this._owner.xMin + this._owner._rawWidth - h) * a - this._owner._rawWidth : this._owner.x += a * (.5 - r);
                break;

              case t.RelationType.Right_Right:
                e.percent ? this._owner.xMin = h + (this._owner.xMin + this._owner._rawWidth - h) * a - this._owner._rawWidth : this._owner.x += a * (1 - r);
                break;

              case t.RelationType.Top_Top:
                e.percent ? this._owner.yMin = h + (this._owner.yMin - h) * a : 0 != r && (this._owner.y += a * -r);
                break;

              case t.RelationType.Top_Middle:
                e.percent ? this._owner.yMin = h + (this._owner.yMin - h) * a : this._owner.y += a * (.5 - r);
                break;

              case t.RelationType.Top_Bottom:
                e.percent ? this._owner.yMin = h + (this._owner.yMin - h) * a : this._owner.y += a * (1 - r);
                break;

              case t.RelationType.Middle_Middle:
                e.percent ? this._owner.yMin = h + (this._owner.yMin + .5 * this._owner._rawHeight - h) * a - .5 * this._owner._rawHeight : this._owner.y += a * (.5 - r);
                break;

              case t.RelationType.Bottom_Top:
                e.percent ? this._owner.yMin = h + (this._owner.yMin + this._owner._rawHeight - h) * a - this._owner._rawHeight : 0 != r && (this._owner.y += a * -r);
                break;

              case t.RelationType.Bottom_Middle:
                e.percent ? this._owner.yMin = h + (this._owner.yMin + this._owner._rawHeight - h) * a - this._owner._rawHeight : this._owner.y += a * (.5 - r);
                break;

              case t.RelationType.Bottom_Bottom:
                e.percent ? this._owner.yMin = h + (this._owner.yMin + this._owner._rawHeight - h) * a - this._owner._rawHeight : this._owner.y += a * (1 - r);
                break;

              case t.RelationType.Width:
                i = this._owner._underConstruct && this._owner == this._target.parent ? this._owner.sourceWidth - this._target.initWidth : this._owner._rawWidth - this._targetWidth, 
                e.percent && (i *= a), this._target == this._owner.parent ? this._owner.pivotAsAnchor ? (s = this._owner.xMin, 
                this._owner.setSize(this._target._width + i, this._owner._rawHeight, !0), this._owner.xMin = s) : this._owner.setSize(this._target._width + i, this._owner._rawHeight, !0) : this._owner.width = this._target._width + i;
                break;

              case t.RelationType.Height:
                i = this._owner._underConstruct && this._owner == this._target.parent ? this._owner.sourceHeight - this._target.initHeight : this._owner._rawHeight - this._targetHeight, 
                e.percent && (i *= a), this._target == this._owner.parent ? this._owner.pivotAsAnchor ? (s = this._owner.yMin, 
                this._owner.setSize(this._owner._rawWidth, this._target._height + i, !0), this._owner.yMin = s) : this._owner.setSize(this._owner._rawWidth, this._target._height + i, !0) : this._owner.height = this._target._height + i;
                break;

              case t.RelationType.LeftExt_Left:
                s = this._owner.xMin, i = e.percent ? h + (s - h) * a - s : a * -r, this._owner.width = this._owner._rawWidth - i, 
                this._owner.xMin = s + i;
                break;

              case t.RelationType.LeftExt_Right:
                s = this._owner.xMin, i = e.percent ? h + (s - h) * a - s : a * (1 - r), this._owner.width = this._owner._rawWidth - i, 
                this._owner.xMin = s + i;
                break;

              case t.RelationType.RightExt_Left:
                s = this._owner.xMin, i = e.percent ? h + (s + this._owner._rawWidth - h) * a - (s + this._owner._rawWidth) : a * -r, 
                this._owner.width = this._owner._rawWidth + i, this._owner.xMin = s;
                break;

              case t.RelationType.RightExt_Right:
                s = this._owner.xMin, e.percent ? this._owner == this._target.parent ? this._owner._underConstruct ? this._owner.width = h + this._target._width - this._target._width * r + (this._owner.sourceWidth - h - this._target.initWidth + this._target.initWidth * r) * a : this._owner.width = h + (this._owner._rawWidth - h) * a : (i = h + (s + this._owner._rawWidth - h) * a - (s + this._owner._rawWidth), 
                this._owner.width = this._owner._rawWidth + i, this._owner.xMin = s) : this._owner == this._target.parent ? this._owner._underConstruct ? this._owner.width = this._owner.sourceWidth + (this._target._width - this._target.initWidth) * (1 - r) : this._owner.width = this._owner._rawWidth + a * (1 - r) : (i = a * (1 - r), 
                this._owner.width = this._owner._rawWidth + i, this._owner.xMin = s);
                break;

              case t.RelationType.TopExt_Top:
                s = this._owner.yMin, i = e.percent ? h + (s - h) * a - s : a * -r, this._owner.height = this._owner._rawHeight - i, 
                this._owner.yMin = s + i;
                break;

              case t.RelationType.TopExt_Bottom:
                s = this._owner.yMin, i = e.percent ? h + (s - h) * a - s : a * (1 - r), this._owner.height = this._owner._rawHeight - i, 
                this._owner.yMin = s + i;
                break;

              case t.RelationType.BottomExt_Top:
                s = this._owner.yMin, i = e.percent ? h + (s + this._owner._rawHeight - h) * a - (s + this._owner._rawHeight) : a * -r, 
                this._owner.height = this._owner._rawHeight + i, this._owner.yMin = s;
                break;

              case t.RelationType.BottomExt_Bottom:
                s = this._owner.yMin, e.percent ? this._owner == this._target.parent ? this._owner._underConstruct ? this._owner.height = h + this._target._height - this._target._height * r + (this._owner.sourceHeight - h - this._target.initHeight + this._target.initHeight * r) * a : this._owner.height = h + (this._owner._rawHeight - h) * a : (i = h + (s + this._owner._rawHeight - h) * a - (s + this._owner._rawHeight), 
                this._owner.height = this._owner._rawHeight + i, this._owner.yMin = s) : this._owner == this._target.parent ? this._owner._underConstruct ? this._owner.height = this._owner.sourceHeight + (this._target._height - this._target.initHeight) * (1 - r) : this._owner.height = this._owner._rawHeight + a * (1 - r) : (i = a * (1 - r), 
                this._owner.height = this._owner._rawHeight + i, this._owner.yMin = s);
            }
        }
        addRefTarget() {
            this._target != this._owner.parent && this._target.on(t.Events.XY_CHANGED, this, this.__targetXYChanged), 
            this._target.on(t.Events.SIZE_CHANGED, this, this.__targetSizeChanged), this._target.on(t.Events.SIZE_DELAY_CHANGE, this, this.__targetSizeWillChange), 
            this._targetX = this._target.x, this._targetY = this._target.y, this._targetWidth = this._target._width, 
            this._targetHeight = this._target._height;
        }
        releaseRefTarget() {
            null != this._target.displayObject && (this._target.off(t.Events.XY_CHANGED, this, this.__targetXYChanged), 
            this._target.off(t.Events.SIZE_CHANGED, this, this.__targetSizeChanged), this._target.off(t.Events.SIZE_DELAY_CHANGE, this, this.__targetSizeWillChange));
        }
        __targetXYChanged() {
            if (null != this._owner.relations.handling || null != this._owner.group && this._owner.group._updating) return this._targetX = this._target.x, 
            void (this._targetY = this._target.y);
            this._owner.relations.handling = this._target;
            for (var t = this._owner.x, e = this._owner.y, i = this._target.x - this._targetX, s = this._target.y - this._targetY, h = this._defs.length, r = 0; r < h; r++) this.applyOnXYChanged(this._defs[r], i, s);
            if (this._targetX = this._target.x, this._targetY = this._target.y, (t != this._owner.x || e != this._owner.y) && (t = this._owner.x - t, 
            e = this._owner.y - e, this._owner.updateGearFromRelations(1, t, e), this._owner.parent && this._owner.parent._transitions.length > 0)) {
                h = this._owner.parent._transitions.length;
                for (var a = 0; a < h; a++) this._owner.parent._transitions[a].updateFromRelations(this._owner.id, t, e);
            }
            this._owner.relations.handling = null;
        }
        __targetSizeChanged() {
            if (this._owner.relations.sizeDirty && this._owner.relations.ensureRelationsSizeCorrect(), 
            null != this._owner.relations.handling) return this._targetWidth = this._target._width, 
            void (this._targetHeight = this._target._height);
            this._owner.relations.handling = this._target;
            for (var t = this._owner.x, e = this._owner.y, i = this._owner._rawWidth, s = this._owner._rawHeight, h = this._defs.length, r = 0; r < h; r++) this.applyOnSizeChanged(this._defs[r]);
            if (this._targetWidth = this._target._width, this._targetHeight = this._target._height, 
            (t != this._owner.x || e != this._owner.y) && (t = this._owner.x - t, e = this._owner.y - e, 
            this._owner.updateGearFromRelations(1, t, e), this._owner.parent && this._owner.parent._transitions.length > 0)) {
                h = this._owner.parent._transitions.length;
                for (var a = 0; a < h; a++) this._owner.parent._transitions[a].updateFromRelations(this._owner.id, t, e);
            }
            i == this._owner._rawWidth && s == this._owner._rawHeight || (i = this._owner._rawWidth - i, 
            s = this._owner._rawHeight - s, this._owner.updateGearFromRelations(2, i, s)), this._owner.relations.handling = null;
        }
        __targetSizeWillChange() {
            this._owner.relations.sizeDirty = !0;
        }
    };
    class e {
        constructor() {}
        copyFrom(t) {
            this.percent = t.percent, this.type = t.type, this.axis = t.axis;
        }
    }
}(fgui), function(t) {
    t.Relations = class {
        constructor(t) {
            this._owner = t, this._items = [];
        }
        add(e, i, s) {
            for (var h = this._items.length, r = 0; r < h; r++) {
                var a = this._items[r];
                if (a.target == e) return void a.add(i, s);
            }
            var n = new t.RelationItem(this._owner);
            n.target = e, n.add(i, s), this._items.push(n);
        }
        remove(t, e) {
            e = e || 0;
            for (var i = this._items.length, s = 0; s < i; ) {
                var h = this._items[s];
                h.target == t ? (h.remove(e), h.isEmpty ? (h.dispose(), this._items.splice(s, 1), 
                i--) : s++) : s++;
            }
        }
        contains(t) {
            for (var e = this._items.length, i = 0; i < e; i++) if (this._items[i].target == t) return !0;
            return !1;
        }
        clearFor(t) {
            for (var e = this._items.length, i = 0; i < e; ) {
                var s = this._items[i];
                s.target == t ? (s.dispose(), this._items.splice(i, 1), e--) : i++;
            }
        }
        clearAll() {
            for (var t = this._items.length, e = 0; e < t; e++) this._items[e].dispose();
            this._items.length = 0;
        }
        copyFrom(e) {
            this.clearAll();
            for (var i = e._items, s = i.length, h = 0; h < s; h++) {
                var r = i[h], a = new t.RelationItem(this._owner);
                a.copyFrom(r), this._items.push(a);
            }
        }
        dispose() {
            this.clearAll();
        }
        onOwnerSizeChanged(t, e, i) {
            if (0 != this._items.length) for (var s = this._items.length, h = 0; h < s; h++) this._items[h].applyOnSelfResized(t, e, i);
        }
        ensureRelationsSizeCorrect() {
            if (0 != this._items.length) {
                this.sizeDirty = !1;
                for (var t = this._items.length, e = 0; e < t; e++) this._items[e].target.ensureSizeCorrect();
            }
        }
        get empty() {
            return 0 == this._items.length;
        }
        setup(e, i) {
            for (var s, h = e.readByte(), r = 0; r < h; r++) {
                var a = e.getInt16();
                s = -1 == a ? this._owner.parent : i ? this._owner.getChildAt(a) : this._owner.parent.getChildAt(a);
                var n = new t.RelationItem(this._owner);
                n.target = s, this._items.push(n);
                for (var o = e.readByte(), l = 0; l < o; l++) {
                    var _ = e.readByte(), d = e.readBool();
                    n.internalAdd(_, d);
                }
            }
        }
    };
}(fgui), function(t) {
    class e {
        constructor(e) {
            this._owner = e, this._maskContainer = new Laya.Sprite(), this._owner.displayObject.addChild(this._maskContainer), 
            this._container = this._owner._container, this._container.pos(0, 0), this._maskContainer.addChild(this._container), 
            this._mouseWheelEnabled = !0, this._xPos = 0, this._yPos = 0, this._aniFlag = 0, 
            this._tweening = 0, this._loop = 0, this._footerLockedSize = 0, this._headerLockedSize = 0, 
            this._scrollBarMargin = new t.Margin(), this._viewSize = new Laya.Point(), this._contentSize = new Laya.Point(), 
            this._pageSize = new Laya.Point(1, 1), this._overlapSize = new Laya.Point(), this._tweenTime = new Laya.Point(), 
            this._tweenStart = new Laya.Point(), this._tweenDuration = new Laya.Point(), this._tweenChange = new Laya.Point(), 
            this._velocity = new Laya.Point(), this._containerPos = new Laya.Point(), this._beginTouchPos = new Laya.Point(), 
            this._lastTouchPos = new Laya.Point(), this._lastTouchGlobalPos = new Laya.Point(), 
            this._scrollStep = t.UIConfig.defaultScrollStep, this._mouseWheelStep = 2 * this._scrollStep, 
            this._decelerationRate = t.UIConfig.defaultScrollDecelerationRate, this._owner.on(Laya.Event.MOUSE_DOWN, this, this.__mouseDown), 
            this._owner.on(Laya.Event.MOUSE_WHEEL, this, this.__mouseWheel);
        }
        setup(e) {
            this._scrollType = e.readByte();
            var i = e.readByte(), s = e.getInt32();
            e.readBool() && (this._scrollBarMargin.top = e.getInt32(), this._scrollBarMargin.bottom = e.getInt32(), 
            this._scrollBarMargin.left = e.getInt32(), this._scrollBarMargin.right = e.getInt32());
            var h = e.readS(), r = e.readS(), a = e.readS(), n = e.readS();
            if (0 != (1 & s) && (this._displayOnLeft = !0), 0 != (2 & s) && (this._snapToItem = !0), 
            0 != (4 & s) && (this._displayInDemand = !0), 0 != (8 & s) && (this._pageMode = !0), 
            this._touchEffect = !!(16 & s) || !(32 & s) && t.UIConfig.defaultScrollTouchEffect, 
            this._bouncebackEffect = !!(64 & s) || !(128 & s) && t.UIConfig.defaultScrollBounceEffect, 
            0 != (256 & s) && (this._inertiaDisabled = !0), 0 == (512 & s) && (this._maskContainer.scrollRect = new Laya.Rectangle()), 
            0 != (1024 & s) && (this._floating = !0), 0 != (2048 & s) && (this._dontClipMargin = !0), 
            i == t.ScrollBarDisplayType.Default && (i = t.UIConfig.defaultScrollBarDisplay), 
            i != t.ScrollBarDisplayType.Hidden) {
                if (this._scrollType == t.ScrollType.Both || this._scrollType == t.ScrollType.Vertical) {
                    var o = h || t.UIConfig.verticalScrollBar;
                    if (o) {
                        if (this._vtScrollBar = t.UIPackage.createObjectFromURL(o), !this._vtScrollBar) throw "cannot create scrollbar from " + o;
                        this._vtScrollBar.setScrollPane(this, !0), this._owner.displayObject.addChild(this._vtScrollBar.displayObject);
                    }
                }
                if ((this._scrollType == t.ScrollType.Both || this._scrollType == t.ScrollType.Horizontal) && (o = r || t.UIConfig.horizontalScrollBar)) {
                    if (this._hzScrollBar = t.UIPackage.createObjectFromURL(o), !this._hzScrollBar) throw "cannot create scrollbar from " + o;
                    this._hzScrollBar.setScrollPane(this, !1), this._owner.displayObject.addChild(this._hzScrollBar.displayObject);
                }
                i == t.ScrollBarDisplayType.Auto && (this._scrollBarDisplayAuto = !0), this._scrollBarDisplayAuto && (this._vtScrollBar && (this._vtScrollBar.displayObject.visible = !1), 
                this._hzScrollBar && (this._hzScrollBar.displayObject.visible = !1));
            } else this._mouseWheelEnabled = !1;
            if (a && (this._header = t.UIPackage.createObjectFromURL(a), !this._header)) throw new Error("FairyGUI: cannot create scrollPane this.header from " + a);
            if (n && (this._footer = t.UIPackage.createObjectFromURL(n), !this._footer)) throw new Error("FairyGUI: cannot create scrollPane this.footer from " + n);
            (this._header || this._footer) && (this._refreshBarAxis = this._scrollType == t.ScrollType.Both || this._scrollType == t.ScrollType.Vertical ? "y" : "x"), 
            this.setSize(this.owner.width, this.owner.height);
        }
        dispose() {
            e.draggingPane == this && (e.draggingPane = null), 0 != this._tweening && Laya.timer.clear(this, this.tweenUpdate), 
            this._pageController = null, this._hzScrollBar && this._hzScrollBar.dispose(), this._vtScrollBar && this._vtScrollBar.dispose(), 
            this._header && this._header.dispose(), this._footer && this._footer.dispose();
        }
        get owner() {
            return this._owner;
        }
        get hzScrollBar() {
            return this._hzScrollBar;
        }
        get vtScrollBar() {
            return this._vtScrollBar;
        }
        get header() {
            return this._header;
        }
        get footer() {
            return this._footer;
        }
        get bouncebackEffect() {
            return this._bouncebackEffect;
        }
        set bouncebackEffect(t) {
            this._bouncebackEffect = t;
        }
        get touchEffect() {
            return this._touchEffect;
        }
        set touchEffect(t) {
            this._touchEffect = t;
        }
        set scrollStep(e) {
            this._scrollStep = e, 0 == this._scrollStep && (this._scrollStep = t.UIConfig.defaultScrollStep), 
            this._mouseWheelStep = 2 * this._scrollStep;
        }
        get scrollStep() {
            return this._scrollStep;
        }
        get snapToItem() {
            return this._snapToItem;
        }
        set snapToItem(t) {
            this._snapToItem = t;
        }
        get mouseWheelEnabled() {
            return this._mouseWheelEnabled;
        }
        set mouseWheelEnabled(t) {
            this._mouseWheelEnabled = t;
        }
        get decelerationRate() {
            return this._decelerationRate;
        }
        set decelerationRate(t) {
            this._decelerationRate = t;
        }
        get isDragged() {
            return this._dragged;
        }
        get percX() {
            return 0 == this._overlapSize.x ? 0 : this._xPos / this._overlapSize.x;
        }
        set percX(t) {
            this.setPercX(t, !1);
        }
        setPercX(e, i) {
            this._owner.ensureBoundsCorrect(), this.setPosX(this._overlapSize.x * t.ToolSet.clamp01(e), i);
        }
        get percY() {
            return 0 == this._overlapSize.y ? 0 : this._yPos / this._overlapSize.y;
        }
        set percY(t) {
            this.setPercY(t, !1);
        }
        setPercY(e, i) {
            this._owner.ensureBoundsCorrect(), this.setPosY(this._overlapSize.y * t.ToolSet.clamp01(e), i);
        }
        get posX() {
            return this._xPos;
        }
        set posX(t) {
            this.setPosX(t, !1);
        }
        setPosX(e, i) {
            this._owner.ensureBoundsCorrect(), 1 == this._loop && (e = this.loopCheckingNewPos(e, "x")), 
            (e = t.ToolSet.clamp(e, 0, this._overlapSize.x)) != this._xPos && (this._xPos = e, 
            this.posChanged(i));
        }
        get posY() {
            return this._yPos;
        }
        set posY(t) {
            this.setPosY(t, !1);
        }
        setPosY(e, i) {
            this._owner.ensureBoundsCorrect(), 1 == this._loop && (e = this.loopCheckingNewPos(e, "y")), 
            (e = t.ToolSet.clamp(e, 0, this._overlapSize.y)) != this._yPos && (this._yPos = e, 
            this.posChanged(i));
        }
        get contentWidth() {
            return this._contentSize.x;
        }
        get contentHeight() {
            return this._contentSize.y;
        }
        get viewWidth() {
            return this._viewSize.x;
        }
        set viewWidth(t) {
            t = t + this._owner.margin.left + this._owner.margin.right, this._vtScrollBar && !this._floating && (t += this._vtScrollBar.width), 
            this._owner.width = t;
        }
        get viewHeight() {
            return this._viewSize.y;
        }
        set viewHeight(t) {
            t = t + this._owner.margin.top + this._owner.margin.bottom, this._hzScrollBar && !this._floating && (t += this._hzScrollBar.height), 
            this._owner.height = t;
        }
        get currentPageX() {
            if (!this._pageMode) return 0;
            var t = Math.floor(this._xPos / this._pageSize.x);
            return this._xPos - t * this._pageSize.x > .5 * this._pageSize.x && t++, t;
        }
        set currentPageX(t) {
            this.setCurrentPageX(t, !1);
        }
        get currentPageY() {
            if (!this._pageMode) return 0;
            var t = Math.floor(this._yPos / this._pageSize.y);
            return this._yPos - t * this._pageSize.y > .5 * this._pageSize.y && t++, t;
        }
        set currentPageY(t) {
            this.setCurrentPageY(t, !1);
        }
        setCurrentPageX(t, e) {
            this._pageMode && (this._owner.ensureBoundsCorrect(), this._overlapSize.x > 0 && this.setPosX(t * this._pageSize.x, e));
        }
        setCurrentPageY(t, e) {
            this._pageMode && (this._owner.ensureBoundsCorrect(), this._overlapSize.y > 0 && this.setPosY(t * this._pageSize.y, e));
        }
        get isBottomMost() {
            return this._yPos == this._overlapSize.y || 0 == this._overlapSize.y;
        }
        get isRightMost() {
            return this._xPos == this._overlapSize.x || 0 == this._overlapSize.x;
        }
        get pageController() {
            return this._pageController;
        }
        set pageController(t) {
            this._pageController = t;
        }
        get scrollingPosX() {
            return t.ToolSet.clamp(-this._container.x, 0, this._overlapSize.x);
        }
        get scrollingPosY() {
            return t.ToolSet.clamp(-this._container.y, 0, this._overlapSize.y);
        }
        scrollTop(t) {
            this.setPercY(0, t);
        }
        scrollBottom(t) {
            this.setPercY(1, t);
        }
        scrollUp(t, e) {
            t = t || 1, this._pageMode ? this.setPosY(this._yPos - this._pageSize.y * t, e) : this.setPosY(this._yPos - this._scrollStep * t, e);
        }
        scrollDown(t, e) {
            t = t || 1, this._pageMode ? this.setPosY(this._yPos + this._pageSize.y * t, e) : this.setPosY(this._yPos + this._scrollStep * t, e);
        }
        scrollLeft(t, e) {
            t = t || 1, this._pageMode ? this.setPosX(this._xPos - this._pageSize.x * t, e) : this.setPosX(this._xPos - this._scrollStep * t, e);
        }
        scrollRight(t, e) {
            t = t || 1, this._pageMode ? this.setPosX(this._xPos + this._pageSize.x * t, e) : this.setPosX(this._xPos + this._scrollStep * t, e);
        }
        scrollToView(e, i, s) {
            var h;
            if (this._owner.ensureBoundsCorrect(), this._needRefresh && this.refresh(), e instanceof t.GObject ? e.parent != this._owner ? (e.parent.localToGlobalRect(e.x, e.y, e.width, e.height, n), 
            h = this._owner.globalToLocalRect(n.x, n.y, n.width, n.height, n)) : (h = n).setTo(e.x, e.y, e.width, e.height) : h = e, 
            this._overlapSize.y > 0) {
                var r = this._yPos + this._viewSize.y;
                s || h.y <= this._yPos || h.height >= this._viewSize.y ? this._pageMode ? this.setPosY(Math.floor(h.y / this._pageSize.y) * this._pageSize.y, i) : this.setPosY(h.y, i) : h.y + h.height > r && (this._pageMode ? this.setPosY(Math.floor(h.y / this._pageSize.y) * this._pageSize.y, i) : h.height <= this._viewSize.y / 2 ? this.setPosY(h.y + 2 * h.height - this._viewSize.y, i) : this.setPosY(h.y + h.height - this._viewSize.y, i));
            }
            if (this._overlapSize.x > 0) {
                var a = this._xPos + this._viewSize.x;
                s || h.x <= this._xPos || h.width >= this._viewSize.x ? this._pageMode ? this.setPosX(Math.floor(h.x / this._pageSize.x) * this._pageSize.x, i) : this.setPosX(h.x, i) : h.x + h.width > a && (this._pageMode ? this.setPosX(Math.floor(h.x / this._pageSize.x) * this._pageSize.x, i) : h.width <= this._viewSize.x / 2 ? this.setPosX(h.x + 2 * h.width - this._viewSize.x, i) : this.setPosX(h.x + h.width - this._viewSize.x, i));
            }
            !i && this._needRefresh && this.refresh();
        }
        isChildInView(t) {
            if (this._overlapSize.y > 0) {
                var e = t.y + this._container.y;
                if (e < -t.height || e > this._viewSize.y) return !1;
            }
            return !(this._overlapSize.x > 0 && ((e = t.x + this._container.x) < -t.width || e > this._viewSize.x));
        }
        cancelDragging() {
            this._owner.displayObject.stage.off(Laya.Event.MOUSE_MOVE, this, this.__mouseMove), 
            this._owner.displayObject.stage.off(Laya.Event.MOUSE_UP, this, this.__mouseUp), 
            this._owner.displayObject.stage.off(Laya.Event.CLICK, this, this.__click), e.draggingPane == this && (e.draggingPane = null), 
            i = 0, this._dragged = !1, this._maskContainer.mouseEnabled = !0;
        }
        lockHeader(t) {
            this._headerLockedSize != t && (this._headerLockedSize = t, !this._refreshEventDispatching && this._container[this._refreshBarAxis] >= 0 && (this._tweenStart.setTo(this._container.x, this._container.y), 
            this._tweenChange.setTo(0, 0), this._tweenChange[this._refreshBarAxis] = this._headerLockedSize - this._tweenStart[this._refreshBarAxis], 
            this._tweenDuration.setTo(h, h), this.startTween(2)));
        }
        lockFooter(t) {
            if (this._footerLockedSize != t && (this._footerLockedSize = t, !this._refreshEventDispatching && this._container[this._refreshBarAxis] <= -this._overlapSize[this._refreshBarAxis])) {
                this._tweenStart.setTo(this._container.x, this._container.y), this._tweenChange.setTo(0, 0);
                var e = this._overlapSize[this._refreshBarAxis];
                0 == e ? e = Math.max(this._contentSize[this._refreshBarAxis] + this._footerLockedSize - this._viewSize[this._refreshBarAxis], 0) : e += this._footerLockedSize, 
                this._tweenChange[this._refreshBarAxis] = -e - this._tweenStart[this._refreshBarAxis], 
                this._tweenDuration.setTo(h, h), this.startTween(2);
            }
        }
        onOwnerSizeChanged() {
            this.setSize(this._owner.width, this._owner.height), this.posChanged(!1);
        }
        handleControllerChanged(e) {
            this._pageController == e && (this._scrollType == t.ScrollType.Horizontal ? this.setCurrentPageX(e.selectedIndex, !0) : this.setCurrentPageY(e.selectedIndex, !0));
        }
        updatePageController() {
            var e;
            if (null != this._pageController && !this._pageController.changing && (e = this._scrollType == t.ScrollType.Horizontal ? this.currentPageX : this.currentPageY) < this._pageController.pageCount) {
                var i = this._pageController;
                this._pageController = null, i.selectedIndex = e, this._pageController = i;
            }
        }
        adjustMaskContainer() {
            var t = 0, e = 0;
            this._dontClipMargin ? this._displayOnLeft && this._vtScrollBar && !this._floating && (t = this._vtScrollBar.width) : (t = this._displayOnLeft && this._vtScrollBar && !this._floating ? this._owner.margin.left + this._vtScrollBar.width : this._owner.margin.left, 
            e = this._owner.margin.top), this._maskContainer.pos(t, e), t = this._owner._alignOffset.x, 
            e = this._owner._alignOffset.y, (0 != t || 0 != e || this._dontClipMargin) && (this._alignContainer || (this._alignContainer = new Laya.Sprite(), 
            this._maskContainer.addChild(this._alignContainer), this._alignContainer.addChild(this._container))), 
            this._alignContainer && (this._dontClipMargin && (t += this._owner.margin.left, 
            e += this._owner.margin.top), this._alignContainer.pos(t, e));
        }
        setSize(t, e) {
            this.adjustMaskContainer(), this._hzScrollBar && (this._hzScrollBar.y = e - this._hzScrollBar.height, 
            this._vtScrollBar ? (this._hzScrollBar.width = t - this._vtScrollBar.width - this._scrollBarMargin.left - this._scrollBarMargin.right, 
            this._displayOnLeft ? this._hzScrollBar.x = this._scrollBarMargin.left + this._vtScrollBar.width : this._hzScrollBar.x = this._scrollBarMargin.left) : (this._hzScrollBar.width = t - this._scrollBarMargin.left - this._scrollBarMargin.right, 
            this._hzScrollBar.x = this._scrollBarMargin.left)), this._vtScrollBar && (this._displayOnLeft || (this._vtScrollBar.x = t - this._vtScrollBar.width), 
            this._hzScrollBar ? this._vtScrollBar.height = e - this._hzScrollBar.height - this._scrollBarMargin.top - this._scrollBarMargin.bottom : this._vtScrollBar.height = e - this._scrollBarMargin.top - this._scrollBarMargin.bottom, 
            this._vtScrollBar.y = this._scrollBarMargin.top), this._viewSize.x = t, this._viewSize.y = e, 
            this._hzScrollBar && !this._floating && (this._viewSize.y -= this._hzScrollBar.height), 
            this._vtScrollBar && !this._floating && (this._viewSize.x -= this._vtScrollBar.width), 
            this._viewSize.x -= this._owner.margin.left + this._owner.margin.right, this._viewSize.y -= this._owner.margin.top + this._owner.margin.bottom, 
            this._viewSize.x = Math.max(1, this._viewSize.x), this._viewSize.y = Math.max(1, this._viewSize.y), 
            this._pageSize.x = this._viewSize.x, this._pageSize.y = this._viewSize.y, this.handleSizeChanged();
        }
        setContentSize(t, e) {
            this._contentSize.x == t && this._contentSize.y == e || (this._contentSize.x = t, 
            this._contentSize.y = e, this.handleSizeChanged());
        }
        changeContentSizeOnScrolling(t, e, i, s) {
            var h = this._xPos == this._overlapSize.x, r = this._yPos == this._overlapSize.y;
            this._contentSize.x += t, this._contentSize.y += e, this.handleSizeChanged(), 1 == this._tweening ? (0 != t && h && this._tweenChange.x < 0 && (this._xPos = this._overlapSize.x, 
            this._tweenChange.x = -this._xPos - this._tweenStart.x), 0 != e && r && this._tweenChange.y < 0 && (this._yPos = this._overlapSize.y, 
            this._tweenChange.y = -this._yPos - this._tweenStart.y)) : 2 == this._tweening ? (0 != i && (this._container.x -= i, 
            this._tweenStart.x -= i, this._xPos = -this._container.x), 0 != s && (this._container.y -= s, 
            this._tweenStart.y -= s, this._yPos = -this._container.y)) : this._dragged ? (0 != i && (this._container.x -= i, 
            this._containerPos.x -= i, this._xPos = -this._container.x), 0 != s && (this._container.y -= s, 
            this._containerPos.y -= s, this._yPos = -this._container.y)) : (0 != t && h && (this._xPos = this._overlapSize.x, 
            this._container.x = -this._xPos), 0 != e && r && (this._yPos = this._overlapSize.y, 
            this._container.y = -this._yPos)), this._pageMode && this.updatePageController();
        }
        handleSizeChanged() {
            this._displayInDemand && (this._vScrollNone = this._contentSize.y <= this._viewSize.y, 
            this._hScrollNone = this._contentSize.x <= this._viewSize.x), this._vtScrollBar && (0 == this._contentSize.y ? this._vtScrollBar.setDisplayPerc(0) : this._vtScrollBar.setDisplayPerc(Math.min(1, this._viewSize.y / this._contentSize.y))), 
            this._hzScrollBar && (0 == this._contentSize.x ? this._hzScrollBar.setDisplayPerc(0) : this._hzScrollBar.setDisplayPerc(Math.min(1, this._viewSize.x / this._contentSize.x))), 
            this.updateScrollBarVisible();
            var e = this._maskContainer.scrollRect;
            if (e && (e.width = this._viewSize.x, e.height = this._viewSize.y, this._vScrollNone && this._vtScrollBar && (e.width += this._vtScrollBar.width), 
            this._hScrollNone && this._hzScrollBar && (e.height += this._hzScrollBar.height), 
            this._dontClipMargin && (e.width += this._owner.margin.left + this._owner.margin.right, 
            e.height += this._owner.margin.top + this._owner.margin.bottom), this._maskContainer.scrollRect = e), 
            this._scrollType == t.ScrollType.Horizontal || this._scrollType == t.ScrollType.Both ? this._overlapSize.x = Math.ceil(Math.max(0, this._contentSize.x - this._viewSize.x)) : this._overlapSize.x = 0, 
            this._scrollType == t.ScrollType.Vertical || this._scrollType == t.ScrollType.Both ? this._overlapSize.y = Math.ceil(Math.max(0, this._contentSize.y - this._viewSize.y)) : this._overlapSize.y = 0, 
            this._xPos = t.ToolSet.clamp(this._xPos, 0, this._overlapSize.x), this._yPos = t.ToolSet.clamp(this._yPos, 0, this._overlapSize.y), 
            null != this._refreshBarAxis) {
                var i = this._overlapSize[this._refreshBarAxis];
                0 == i ? i = Math.max(this._contentSize[this._refreshBarAxis] + this._footerLockedSize - this._viewSize[this._refreshBarAxis], 0) : i += this._footerLockedSize, 
                "x" == this._refreshBarAxis ? this._container.pos(t.ToolSet.clamp(this._container.x, -i, this._headerLockedSize), t.ToolSet.clamp(this._container.y, -this._overlapSize.y, 0)) : this._container.pos(t.ToolSet.clamp(this._container.x, -this._overlapSize.x, 0), t.ToolSet.clamp(this._container.y, -i, this._headerLockedSize)), 
                this._header && ("x" == this._refreshBarAxis ? this._header.height = this._viewSize.y : this._header.width = this._viewSize.x), 
                this._footer && ("y" == this._refreshBarAxis ? this._footer.height = this._viewSize.y : this._footer.width = this._viewSize.x);
            } else this._container.pos(t.ToolSet.clamp(this._container.x, -this._overlapSize.x, 0), t.ToolSet.clamp(this._container.y, -this._overlapSize.y, 0));
            this.updateScrollBarPos(), this._pageMode && this.updatePageController();
        }
        posChanged(t) {
            0 == this._aniFlag ? this._aniFlag = t ? 1 : -1 : 1 != this._aniFlag || t || (this._aniFlag = -1), 
            this._needRefresh = !0, Laya.timer.callLater(this, this.refresh);
        }
        refresh() {
            this._owner.displayObject && (this._needRefresh = !1, Laya.timer.clear(this, this.refresh), 
            (this._pageMode || this._snapToItem) && (o.setTo(-this._xPos, -this._yPos), this.alignPosition(o, !1), 
            this._xPos = -o.x, this._yPos = -o.y), this.refresh2(), t.Events.dispatch(t.Events.SCROLL, this._owner.displayObject), 
            this._needRefresh && (this._needRefresh = !1, Laya.timer.clear(this, this.refresh), 
            this.refresh2()), this.updateScrollBarPos(), this._aniFlag = 0);
        }
        refresh2() {
            var t, e;
            1 != this._aniFlag || this._dragged ? (0 != this._tweening && this.killTween(), 
            this._container.pos(Math.floor(-this._xPos), Math.floor(-this._yPos)), this.loopCheckingCurrent()) : (this._overlapSize.x > 0 ? t = -Math.floor(this._xPos) : (0 != this._container.x && (this._container.x = 0), 
            t = 0), this._overlapSize.y > 0 ? e = -Math.floor(this._yPos) : (0 != this._container.y && (this._container.y = 0), 
            e = 0), t != this._container.x || e != this._container.y ? (this._tweenDuration.setTo(s, s), 
            this._tweenStart.setTo(this._container.x, this._container.y), this._tweenChange.setTo(t - this._tweenStart.x, e - this._tweenStart.y), 
            this.startTween(1)) : 0 != this._tweening && this.killTween());
            this._pageMode && this.updatePageController();
        }
        __mouseDown() {
            if (this._touchEffect) {
                0 != this._tweening ? (this.killTween(), this._dragged = !0) : this._dragged = !1;
                var t = this._owner.globalToLocal(Laya.stage.mouseX, Laya.stage.mouseY, a);
                this._containerPos.setTo(this._container.x, this._container.y), this._beginTouchPos.setTo(t.x, t.y), 
                this._lastTouchPos.setTo(t.x, t.y), this._lastTouchGlobalPos.setTo(Laya.stage.mouseX, Laya.stage.mouseY), 
                this._isHoldAreaDone = !1, this._velocity.setTo(0, 0), this._velocityScale = 1, 
                this._lastMoveTime = Laya.timer.currTimer / 1e3, this._owner.displayObject.stage.on(Laya.Event.MOUSE_MOVE, this, this.__mouseMove), 
                this._owner.displayObject.stage.on(Laya.Event.MOUSE_UP, this, this.__mouseUp), this._owner.displayObject.stage.on(Laya.Event.CLICK, this, this.__click);
            }
        }
        __mouseMove() {
            if (this._touchEffect && !this.owner.isDisposed && !(e.draggingPane && e.draggingPane != this || t.GObject.draggingObject)) {
                var s, h, n, o = t.UIConfig.touchScrollSensitivity, l = this._owner.globalToLocal(Laya.stage.mouseX, Laya.stage.mouseY, a);
                if (this._scrollType == t.ScrollType.Vertical) {
                    if (!this._isHoldAreaDone) {
                        if (i |= 1, (s = Math.abs(this._beginTouchPos.y - l.y)) < o) return;
                        if (0 != (2 & i) && s < Math.abs(this._beginTouchPos.x - l.x)) return;
                    }
                    h = !0;
                } else if (this._scrollType == t.ScrollType.Horizontal) {
                    if (!this._isHoldAreaDone) {
                        if (i |= 2, (s = Math.abs(this._beginTouchPos.x - l.x)) < o) return;
                        if (0 != (1 & i) && s < Math.abs(this._beginTouchPos.y - l.y)) return;
                    }
                    n = !0;
                } else {
                    if (i = 3, !this._isHoldAreaDone && (s = Math.abs(this._beginTouchPos.y - l.y)) < o && (s = Math.abs(this._beginTouchPos.x - l.x)) < o) return;
                    h = n = !0;
                }
                var _ = Math.floor(this._containerPos.x + l.x - this._beginTouchPos.x), d = Math.floor(this._containerPos.y + l.y - this._beginTouchPos.y);
                h && (d > 0 ? this._bouncebackEffect ? this._header && 0 != this._header.maxHeight ? this._container.y = Math.floor(Math.min(.5 * d, this._header.maxHeight)) : this._container.y = Math.floor(Math.min(.5 * d, this._viewSize.y * r)) : this._container.y = 0 : d < -this._overlapSize.y ? this._bouncebackEffect ? this._footer && this._footer.maxHeight > 0 ? this._container.y = Math.floor(Math.max(.5 * (d + this._overlapSize.y), -this._footer.maxHeight) - this._overlapSize.y) : this._container.y = Math.floor(Math.max(.5 * (d + this._overlapSize.y), -this._viewSize.y * r) - this._overlapSize.y) : this._container.y = -this._overlapSize.y : this._container.y = d), 
                n && (_ > 0 ? this._bouncebackEffect ? this._header && 0 != this._header.maxWidth ? this._container.x = Math.floor(Math.min(.5 * _, this._header.maxWidth)) : this._container.x = Math.floor(Math.min(.5 * _, this._viewSize.x * r)) : this._container.x = 0 : _ < 0 - this._overlapSize.x ? this._bouncebackEffect ? this._footer && this._footer.maxWidth > 0 ? this._container.x = Math.floor(Math.max(.5 * (_ + this._overlapSize.x), -this._footer.maxWidth) - this._overlapSize.x) : this._container.x = Math.floor(Math.max(.5 * (_ + this._overlapSize.x), -this._viewSize.x * r) - this._overlapSize.x) : this._container.x = -this._overlapSize.x : this._container.x = _);
                var c = Laya.stage.frameRate == Laya.Stage.FRAME_SLOW ? 30 : 60, u = Laya.timer.currTimer / 1e3, g = Math.max(u - this._lastMoveTime, 1 / c), p = l.x - this._lastTouchPos.x, f = l.y - this._lastTouchPos.y;
                if (n || (p = 0), h || (f = 0), 0 != g) {
                    var y = g * c - 1;
                    if (y > 1) {
                        var m = Math.pow(.833, y);
                        this._velocity.x = this._velocity.x * m, this._velocity.y = this._velocity.y * m;
                    }
                    this._velocity.x = t.ToolSet.lerp(this._velocity.x, 60 * p / c / g, 10 * g), this._velocity.y = t.ToolSet.lerp(this._velocity.y, 60 * f / c / g, 10 * g);
                }
                var v = this._lastTouchGlobalPos.x - Laya.stage.mouseX, w = this._lastTouchGlobalPos.y - Laya.stage.mouseY;
                0 != p ? this._velocityScale = Math.abs(v / p) : 0 != f && (this._velocityScale = Math.abs(w / f)), 
                this._lastTouchPos.setTo(l.x, l.y), this._lastTouchGlobalPos.setTo(Laya.stage.mouseX, Laya.stage.mouseY), 
                this._lastMoveTime = u, this._overlapSize.x > 0 && (this._xPos = t.ToolSet.clamp(-this._container.x, 0, this._overlapSize.x)), 
                this._overlapSize.y > 0 && (this._yPos = t.ToolSet.clamp(-this._container.y, 0, this._overlapSize.y)), 
                0 != this._loop && (_ = this._container.x, d = this._container.y, this.loopCheckingCurrent() && (this._containerPos.x += this._container.x - _, 
                this._containerPos.y += this._container.y - d)), e.draggingPane = this, this._isHoldAreaDone = !0, 
                this._dragged = !0, this._maskContainer.mouseEnabled = !1, this.updateScrollBarPos(), 
                this.updateScrollBarVisible(), this._pageMode && this.updatePageController(), t.Events.dispatch(t.Events.SCROLL, this._owner.displayObject);
            }
        }
        __mouseUp() {
            if (!this._owner.isDisposed) {
                if (this._owner.displayObject.stage.off(Laya.Event.MOUSE_MOVE, this, this.__mouseMove), 
                this._owner.displayObject.stage.off(Laya.Event.MOUSE_UP, this, this.__mouseUp), 
                this._owner.displayObject.stage.off(Laya.Event.CLICK, this, this.__click), e.draggingPane == this && (e.draggingPane = null), 
                i = 0, !this._dragged || !this._touchEffect) return this._dragged = !1, void (this._maskContainer.mouseEnabled = !0);
                this._dragged = !1, this._maskContainer.mouseEnabled = !0, this._tweenStart.setTo(this._container.x, this._container.y), 
                o.setTo(this._tweenStart.x, this._tweenStart.y);
                var s = !1;
                if (this._container.x > 0 ? (o.x = 0, s = !0) : this._container.x < -this._overlapSize.x && (o.x = -this._overlapSize.x, 
                s = !0), this._container.y > 0 ? (o.y = 0, s = !0) : this._container.y < -this._overlapSize.y && (o.y = -this._overlapSize.y, 
                s = !0), s) {
                    if (this._tweenChange.setTo(o.x - this._tweenStart.x, o.y - this._tweenStart.y), 
                    this._tweenChange.x < -t.UIConfig.touchDragSensitivity || this._tweenChange.y < -t.UIConfig.touchDragSensitivity ? (this._refreshEventDispatching = !0, 
                    t.Events.dispatch(t.Events.PULL_DOWN_RELEASE, this._owner.displayObject), this._refreshEventDispatching = !1) : (this._tweenChange.x > t.UIConfig.touchDragSensitivity || this._tweenChange.y > t.UIConfig.touchDragSensitivity) && (this._refreshEventDispatching = !0, 
                    t.Events.dispatch(t.Events.PULL_UP_RELEASE, this._owner.displayObject), this._refreshEventDispatching = !1), 
                    this._headerLockedSize > 0 && 0 == o[this._refreshBarAxis]) o[this._refreshBarAxis] = this._headerLockedSize, 
                    this._tweenChange.x = o.x - this._tweenStart.x, this._tweenChange.y = o.y - this._tweenStart.y; else if (this._footerLockedSize > 0 && o[this._refreshBarAxis] == -this._overlapSize[this._refreshBarAxis]) {
                        var r = this._overlapSize[this._refreshBarAxis];
                        0 == r ? r = Math.max(this._contentSize[this._refreshBarAxis] + this._footerLockedSize - this._viewSize[this._refreshBarAxis], 0) : r += this._footerLockedSize, 
                        o[this._refreshBarAxis] = -r, this._tweenChange.x = o.x - this._tweenStart.x, this._tweenChange.y = o.y - this._tweenStart.y;
                    }
                    this._tweenDuration.setTo(h, h);
                } else {
                    if (this._inertiaDisabled) this._tweenDuration.setTo(h, h); else {
                        var a = Laya.stage.frameRate == Laya.Stage.FRAME_SLOW ? 30 : 60, n = (Laya.timer.currTimer / 1e3 - this._lastMoveTime) * a - 1;
                        if (n > 1) {
                            var _ = Math.pow(.833, n);
                            this._velocity.x = this._velocity.x * _, this._velocity.y = this._velocity.y * _;
                        }
                        this.updateTargetAndDuration(this._tweenStart, o);
                    }
                    if (l.setTo(o.x - this._tweenStart.x, o.y - this._tweenStart.y), this.loopCheckingTarget(o), 
                    (this._pageMode || this._snapToItem) && this.alignPosition(o, !0), this._tweenChange.x = o.x - this._tweenStart.x, 
                    this._tweenChange.y = o.y - this._tweenStart.y, 0 == this._tweenChange.x && 0 == this._tweenChange.y) return void this.updateScrollBarVisible();
                    (this._pageMode || this._snapToItem) && (this.fixDuration("x", l.x), this.fixDuration("y", l.y));
                }
                this.startTween(2);
            }
        }
        __click() {
            this._dragged = !1;
        }
        __mouseWheel(t) {
            if (this._mouseWheelEnabled) {
                var e = t.delta;
                e = e > 0 ? -1 : e < 0 ? 1 : 0, this._overlapSize.x > 0 && 0 == this._overlapSize.y ? this._pageMode ? this.setPosX(this._xPos + this._pageSize.x * e, !1) : this.setPosX(this._xPos + this._mouseWheelStep * e, !1) : this._pageMode ? this.setPosY(this._yPos + this._pageSize.y * e, !1) : this.setPosY(this._yPos + this._mouseWheelStep * e, !1);
            }
        }
        updateScrollBarPos() {
            this._vtScrollBar && this._vtScrollBar.setScrollPerc(0 == this._overlapSize.y ? 0 : t.ToolSet.clamp(-this._container.y, 0, this._overlapSize.y) / this._overlapSize.y), 
            this._hzScrollBar && this._hzScrollBar.setScrollPerc(0 == this._overlapSize.x ? 0 : t.ToolSet.clamp(-this._container.x, 0, this._overlapSize.x) / this._overlapSize.x), 
            this.checkRefreshBar();
        }
        updateScrollBarVisible() {
            this._vtScrollBar && (this._viewSize.y <= this._vtScrollBar.minSize || this._vScrollNone ? this._vtScrollBar.displayObject.visible = !1 : this.updateScrollBarVisible2(this._vtScrollBar)), 
            this._hzScrollBar && (this._viewSize.x <= this._hzScrollBar.minSize || this._hScrollNone ? this._hzScrollBar.displayObject.visible = !1 : this.updateScrollBarVisible2(this._hzScrollBar));
        }
        updateScrollBarVisible2(e) {
            this._scrollBarDisplayAuto && t.GTween.kill(e, !1, "alpha"), !this._scrollBarDisplayAuto || 0 != this._tweening || this._dragged || e.gripDragging ? (e.alpha = 1, 
            e.displayObject.visible = !0) : e.displayObject.visible && t.GTween.to(1, 0, .5).setDelay(.5).onComplete(this.__barTweenComplete, this).setTarget(e, "alpha");
        }
        __barTweenComplete(t) {
            var e = t.target;
            e.alpha = 1, e.displayObject.visible = !1;
        }
        getLoopPartSize(t, e) {
            return (this._contentSize[e] + ("x" == e ? this._owner.columnGap : this._owner.lineGap)) / t;
        }
        loopCheckingCurrent() {
            var t = !1;
            return 1 == this._loop && this._overlapSize.x > 0 ? this._xPos < .001 ? (this._xPos += this.getLoopPartSize(2, "x"), 
            t = !0) : this._xPos >= this._overlapSize.x && (this._xPos -= this.getLoopPartSize(2, "x"), 
            t = !0) : 2 == this._loop && this._overlapSize.y > 0 && (this._yPos < .001 ? (this._yPos += this.getLoopPartSize(2, "y"), 
            t = !0) : this._yPos >= this._overlapSize.y && (this._yPos -= this.getLoopPartSize(2, "y"), 
            t = !0)), t && this._container.pos(Math.floor(-this._xPos), Math.floor(-this._yPos)), 
            t;
        }
        loopCheckingTarget(t) {
            1 == this._loop && this.loopCheckingTarget2(t, "x"), 2 == this._loop && this.loopCheckingTarget2(t, "y");
        }
        loopCheckingTarget2(t, e) {
            var i, s;
            t[e] > 0 ? (i = this.getLoopPartSize(2, e), (s = this._tweenStart[e] - i) <= 0 && s >= -this._overlapSize[e] && (t[e] -= i, 
            this._tweenStart[e] = s)) : t[e] < -this._overlapSize[e] && (i = this.getLoopPartSize(2, e), 
            (s = this._tweenStart[e] + i) <= 0 && s >= -this._overlapSize[e] && (t[e] += i, 
            this._tweenStart[e] = s));
        }
        loopCheckingNewPos(e, i) {
            if (0 == this._overlapSize[i]) return e;
            var s, h = "x" == i ? this._xPos : this._yPos, r = !1;
            return e < .001 ? (e += this.getLoopPartSize(2, i)) > h && (s = this.getLoopPartSize(6, i), 
            s = Math.ceil((e - h) / s) * s, h = t.ToolSet.clamp(h + s, 0, this._overlapSize[i]), 
            r = !0) : e >= this._overlapSize[i] && (e -= this.getLoopPartSize(2, i)) < h && (s = this.getLoopPartSize(6, i), 
            s = Math.ceil((h - e) / s) * s, h = t.ToolSet.clamp(h - s, 0, this._overlapSize[i]), 
            r = !0), r && ("x" == i ? this._container.x = -Math.floor(h) : this._container.y = -Math.floor(h)), 
            e;
        }
        alignPosition(t, e) {
            if (this._pageMode) t.x = this.alignByPage(t.x, "x", e), t.y = this.alignByPage(t.y, "y", e); else if (this._snapToItem) {
                var i = 0, s = 0;
                e && (i = t.x - this._containerPos.x, s = t.y - this._containerPos.y);
                var h = this._owner.getSnappingPositionWithDir(-t.x, -t.y, i, s, a);
                t.x < 0 && t.x > -this._overlapSize.x && (t.x = -h.x), t.y < 0 && t.y > -this._overlapSize.y && (t.y = -h.y);
            }
        }
        alignByPage(e, i, s) {
            var h;
            if (e > 0) h = 0; else if (e < -this._overlapSize[i]) h = Math.ceil(this._contentSize[i] / this._pageSize[i]) - 1; else {
                h = Math.floor(-e / this._pageSize[i]);
                var r = s ? e - this._containerPos[i] : e - this._container[i], a = Math.min(this._pageSize[i], this._contentSize[i] - (h + 1) * this._pageSize[i]), n = -e - h * this._pageSize[i];
                Math.abs(r) > this._pageSize[i] ? n > .5 * a && h++ : n > a * (r < 0 ? t.UIConfig.defaultScrollPagingThreshold : 1 - t.UIConfig.defaultScrollPagingThreshold) && h++, 
                (e = -h * this._pageSize[i]) < -this._overlapSize[i] && (e = -this._overlapSize[i]);
            }
            if (s) {
                var o, l = this._tweenStart[i];
                o = l > 0 ? 0 : l < -this._overlapSize[i] ? Math.ceil(this._contentSize[i] / this._pageSize[i]) - 1 : Math.floor(-l / this._pageSize[i]);
                var _ = Math.floor(-this._containerPos[i] / this._pageSize[i]);
                Math.abs(h - _) > 1 && Math.abs(o - _) <= 1 && (e = -(h = h > _ ? _ + 1 : _ - 1) * this._pageSize[i]);
            }
            return e;
        }
        updateTargetAndDuration(t, e) {
            e.x = this.updateTargetAndDuration2(t.x, "x"), e.y = this.updateTargetAndDuration2(t.y, "y");
        }
        updateTargetAndDuration2(t, e) {
            var i = this._velocity[e], s = 0;
            if (t > 0) t = 0; else if (t < -this._overlapSize[e]) t = -this._overlapSize[e]; else {
                var r = Math.abs(i) * this._velocityScale;
                Laya.Browser.onMobile && (r *= 1136 / Math.max(Laya.stage.width, Laya.stage.height));
                var a = 0;
                if (this._pageMode || !Laya.Browser.onMobile ? r > 500 && (a = Math.pow((r - 500) / 500, 2)) : r > 1e3 && (a = Math.pow((r - 1e3) / 1e3, 2)), 
                0 != a) a > 1 && (a = 1), r *= a, i *= a, this._velocity[e] = i, s = Math.log(60 / r) / Math.log(this._decelerationRate) / 60, 
                t += Math.floor(i * s * .4);
            }
            return s < h && (s = h), this._tweenDuration[e] = s, t;
        }
        fixDuration(t, e) {
            if (!(0 == this._tweenChange[t] || Math.abs(this._tweenChange[t]) >= Math.abs(e))) {
                var i = Math.abs(this._tweenChange[t] / e) * this._tweenDuration[t];
                i < h && (i = h), this._tweenDuration[t] = i;
            }
        }
        startTween(t) {
            this._tweenTime.setTo(0, 0), this._tweening = t, Laya.timer.frameLoop(1, this, this.tweenUpdate), 
            this.updateScrollBarVisible();
        }
        killTween() {
            1 == this._tweening && (this._container.pos(this._tweenStart.x + this._tweenChange.x, this._tweenStart.y + this._tweenChange.y), 
            t.Events.dispatch(t.Events.SCROLL, this._owner.displayObject)), this._tweening = 0, 
            Laya.timer.clear(this, this.tweenUpdate), this.updateScrollBarVisible(), t.Events.dispatch(t.Events.SCROLL_END, this._owner.displayObject);
        }
        checkRefreshBar() {
            if (this._header || this._footer) {
                var t = this._container[this._refreshBarAxis];
                if (this._header) if (t > 0) {
                    this._header.displayObject.parent || this._maskContainer.addChildAt(this._header.displayObject, 0);
                    var e = a;
                    e.setTo(this._header.width, this._header.height), e[this._refreshBarAxis] = t, this._header.setSize(e.x, e.y);
                } else this._header.displayObject.parent && this._maskContainer.removeChild(this._header.displayObject);
                if (this._footer) {
                    var i = this._overlapSize[this._refreshBarAxis];
                    t < -i || 0 == i && this._footerLockedSize > 0 ? (this._footer.displayObject.parent || this._maskContainer.addChildAt(this._footer.displayObject, 0), 
                    (e = a).setTo(this._footer.x, this._footer.y), e[this._refreshBarAxis] = i > 0 ? t + this._contentSize[this._refreshBarAxis] : Math.max(Math.min(t + this._viewSize[this._refreshBarAxis], this._viewSize[this._refreshBarAxis] - this._footerLockedSize), this._viewSize[this._refreshBarAxis] - this._contentSize[this._refreshBarAxis]), 
                    this._footer.setXY(e.x, e.y), e.setTo(this._footer.width, this._footer.height), 
                    e[this._refreshBarAxis] = i > 0 ? -i - t : this._viewSize[this._refreshBarAxis] - this._footer[this._refreshBarAxis], 
                    this._footer.setSize(e.x, e.y)) : this._footer.displayObject.parent && this._maskContainer.removeChild(this._footer.displayObject);
                }
            }
        }
        tweenUpdate() {
            var e = this.runTween("x"), i = this.runTween("y");
            this._container.pos(e, i), 2 == this._tweening && (this._overlapSize.x > 0 && (this._xPos = t.ToolSet.clamp(-e, 0, this._overlapSize.x)), 
            this._overlapSize.y > 0 && (this._yPos = t.ToolSet.clamp(-i, 0, this._overlapSize.y)), 
            this._pageMode && this.updatePageController()), 0 == this._tweenChange.x && 0 == this._tweenChange.y ? (this._tweening = 0, 
            Laya.timer.clear(this, this.tweenUpdate), this.loopCheckingCurrent(), this.updateScrollBarPos(), 
            this.updateScrollBarVisible(), t.Events.dispatch(t.Events.SCROLL, this._owner.displayObject), 
            t.Events.dispatch(t.Events.SCROLL_END, this._owner.displayObject)) : (this.updateScrollBarPos(), 
            t.Events.dispatch(t.Events.SCROLL, this._owner.displayObject));
        }
        runTween(t) {
            var e, i, s;
            if (0 != this._tweenChange[t]) {
                if (this._tweenTime[t] += Laya.timer.delta / 1e3, this._tweenTime[t] >= this._tweenDuration[t]) e = this._tweenStart[t] + this._tweenChange[t], 
                this._tweenChange[t] = 0; else {
                    var r = (i = this._tweenTime[t], s = this._tweenDuration[t], (i = i / s - 1) * i * i + 1);
                    e = this._tweenStart[t] + Math.floor(this._tweenChange[t] * r);
                }
                var a = 0, n = -this._overlapSize[t];
                if (this._headerLockedSize > 0 && this._refreshBarAxis == t && (a = this._headerLockedSize), 
                this._footerLockedSize > 0 && this._refreshBarAxis == t) {
                    var o = this._overlapSize[this._refreshBarAxis];
                    0 == o ? o = Math.max(this._contentSize[this._refreshBarAxis] + this._footerLockedSize - this._viewSize[this._refreshBarAxis], 0) : o += this._footerLockedSize, 
                    n = -o;
                }
                2 == this._tweening && this._bouncebackEffect ? e > 20 + a && this._tweenChange[t] > 0 || e > a && 0 == this._tweenChange[t] ? (this._tweenTime[t] = 0, 
                this._tweenDuration[t] = h, this._tweenChange[t] = -e + a, this._tweenStart[t] = e) : (e < n - 20 && this._tweenChange[t] < 0 || e < n && 0 == this._tweenChange[t]) && (this._tweenTime[t] = 0, 
                this._tweenDuration[t] = h, this._tweenChange[t] = n - e, this._tweenStart[t] = e) : e > a ? (e = a, 
                this._tweenChange[t] = 0) : e < n && (e = n, this._tweenChange[t] = 0);
            } else e = this._container[t];
            return e;
        }
    }
    t.ScrollPane = e;
    var i = 0;
    const s = .5, h = .3, r = .5;
    var a = new Laya.Point(), n = new Laya.Rectangle(), o = new Laya.Point(), l = new Laya.Point();
}(fgui), function(t) {
    t.Transition = class {
        constructor(t) {
            this._owner = t, this._items = new Array(), this._totalDuration = 0, this._autoPlayTimes = 1, 
            this._autoPlayDelay = 0, this._timeScale = 1, this._startTime = 0, this._endTime = 0;
        }
        play(t, e, i, s, h) {
            this._play(t, e, i, s, h, !1);
        }
        playReverse(t, e, i, s, h) {
            this._play(t, 1, i, s, h, !0);
        }
        changePlayTimes(t) {
            this._totalTimes = t;
        }
        setAutoPlay(t, e, i) {
            null == e && (e = -1), null == i && (i = 0), this._autoPlay != t && (this._autoPlay = t, 
            this._autoPlayTimes = e, this._autoPlayDelay = i, this._autoPlay ? this._owner.onStage && this.play(null, null, this._autoPlayTimes, this._autoPlayDelay) : this._owner.onStage || this.stop(!1, !0));
        }
        _play(i, s, h, r, a, n) {
            null == s && (s = 1), null == h && (h = 0), null == r && (r = 0), null == a && (a = -1), 
            this.stop(!0, !0), this._totalTimes = s, this._reversed = n, this._startTime = r, 
            this._endTime = a, this._playing = !0, this._paused = !1, this._onComplete = i;
            for (var o = this._items.length, l = 0; l < o; l++) {
                var _ = this._items[l];
                if (null == _.target ? _.targetId ? _.target = this._owner.getChildById(_.targetId) : _.target = this._owner : _.target != this._owner && _.target.parent != this._owner && (_.target = null), 
                _.target && _.type == e.Transition) {
                    var d = _.target.getTransition(_.value.transName);
                    if (d == this && (d = null), d) if (0 == _.value.playTimes) {
                        var c;
                        for (c = l - 1; c >= 0; c--) {
                            var u = this._items[c];
                            if (u.type == e.Transition && u.value.trans == d) {
                                u.value.stopTime = _.time - u.time;
                                break;
                            }
                        }
                        c < 0 ? _.value.stopTime = 0 : d = null;
                    } else _.value.stopTime = -1;
                    _.value.trans = d;
                }
            }
            0 == h ? this.onDelayedPlay() : t.GTween.delayedCall(h).setTarget(this).onComplete(this.onDelayedPlay, this);
        }
        stop(e, i) {
            if (this._playing) {
                null == e && (e = !0), this._playing = !1, this._totalTasks = 0, this._totalTimes = 0;
                var s = this._onComplete;
                this._onComplete = null, t.GTween.kill(this);
                var h = this._items.length;
                if (this._reversed) for (var r = h - 1; r >= 0; r--) {
                    var a = this._items[r];
                    null != a.target && this.stopItem(a, e);
                } else for (r = 0; r < h; r++) null != (a = this._items[r]).target && this.stopItem(a, e);
                i && s && s.run();
            }
        }
        stopItem(t, i) {
            if (0 != t.displayLockToken && (t.target.releaseDisplayLock(t.displayLockToken), 
            t.displayLockToken = 0), t.tweener && (t.tweener.kill(i), t.tweener = null, t.type != e.Shake || i || (t.target._gearLocked = !0, 
            t.target.setXY(t.target.x - t.value.lastOffsetX, t.target.y - t.value.lastOffsetY), 
            t.target._gearLocked = !1)), t.type == e.Transition) {
                var s = t.value.trans;
                s && s.stop(i, !1);
            }
        }
        setPaused(i) {
            if (this._playing && this._paused != i) {
                this._paused = i;
                var s = t.GTween.getTween(this);
                s && s.setPaused(i);
                for (var h = this._items.length, r = 0; r < h; r++) {
                    var a = this._items[r];
                    null != a.target && (a.type == e.Transition ? a.value.trans && a.value.trans.setPaused(i) : a.type == e.Animation && (i ? (a.value.flag = a.target.getProp(t.ObjectPropID.Playing), 
                    a.target.setProp(t.ObjectPropID.Playing, !1)) : a.target.setProp(t.ObjectPropID.Playing, a.value.flag)), 
                    a.tweener && a.tweener.setPaused(i));
                }
            }
        }
        dispose() {
            this._playing && t.GTween.kill(this);
            for (var e = this._items.length, i = 0; i < e; i++) {
                var s = this._items[i];
                s.tweener && (s.tweener.kill(), s.tweener = null), s.target = null, s.hook = null, 
                s.tweenConfig && (s.tweenConfig.endHook = null);
            }
            this._items.length = 0, this._playing = !1, this._onComplete = null;
        }
        get playing() {
            return this._playing;
        }
        setValue(t, ...i) {
            for (var s, h = this._items.length, r = !1, a = 0; a < h; a++) {
                var n = this._items[a];
                if (n.label == t) s = n.tweenConfig ? n.tweenConfig.startValue : n.value, r = !0; else {
                    if (!n.tweenConfig || n.tweenConfig.endLabel != t) continue;
                    s = n.tweenConfig.endValue, r = !0;
                }
                switch (n.type) {
                  case e.XY:
                  case e.Size:
                  case e.Pivot:
                  case e.Scale:
                  case e.Skew:
                    s.b1 = !0, s.b2 = !0, s.f1 = parseFloat(i[0]), s.f2 = parseFloat(i[1]);
                    break;

                  case e.Alpha:
                  case e.Rotation:
                  case e.Color:
                    s.f1 = parseFloat(i[0]);
                    break;

                  case e.Animation:
                    s.frame = parseInt(i[0]), i.length > 1 && (s.playing = i[1]);
                    break;

                  case e.Visible:
                    s.visible = i[0];
                    break;

                  case e.Sound:
                    s.sound = i[0], i.length > 1 && (s.volume = parseFloat(i[1]));
                    break;

                  case e.Transition:
                    s.transName = i[0], i.length > 1 && (s.playTimes = parseInt(i[1]));
                    break;

                  case e.Shake:
                    s.amplitude = parseFloat(i[0]), i.length > 1 && (s.duration = parseFloat(i[1]));
                    break;

                  case e.ColorFilter:
                    s.f1 = parseFloat(i[0]), s.f2 = parseFloat(i[1]), s.f3 = parseFloat(i[2]), s.f4 = parseFloat(i[3]);
                    break;

                  case e.Text:
                  case e.Icon:
                    s.text = i[0];
                }
            }
            if (!r) throw new Error("this.label not exists");
        }
        setHook(t, e) {
            for (var i = this._items.length, s = !1, h = 0; h < i; h++) {
                var r = this._items[h];
                if (r.label == t) {
                    r.hook = e, s = !0;
                    break;
                }
                if (r.tweenConfig && r.tweenConfig.endLabel == t) {
                    r.tweenConfig.endHook = e, s = !0;
                    break;
                }
            }
            if (!s) throw new Error("this.label not exists");
        }
        clearHooks() {
            for (var t = this._items.length, e = 0; e < t; e++) {
                var i = this._items[e];
                i.hook = null, i.tweenConfig && (i.tweenConfig.endHook = null);
            }
        }
        setTarget(t, e) {
            for (var i = this._items.length, s = !1, h = 0; h < i; h++) {
                var r = this._items[h];
                r.label == t && (r.targetId = e == this._owner || null == e ? "" : e.id, this._playing ? r.targetId.length > 0 ? r.target = this._owner.getChildById(r.targetId) : r.target = this._owner : r.target = null, 
                s = !0);
            }
            if (!s) throw new Error("this.label not exists");
        }
        setDuration(t, e) {
            for (var i = this._items.length, s = !1, h = 0; h < i; h++) {
                var r = this._items[h];
                r.tweenConfig && r.label == t && (r.tweenConfig.duration = e, s = !0);
            }
            if (!s) throw new Error("this.label not exists");
        }
        getLabelTime(t) {
            for (var e = this._items.length, i = 0; i < e; i++) {
                var s = this._items[i];
                if (s.label == t) return s.time;
                if (s.tweenConfig && s.tweenConfig.endLabel == t) return s.time + s.tweenConfig.duration;
            }
            return NaN;
        }
        get timeScale() {
            return this._timeScale;
        }
        set timeScale(i) {
            if (this._timeScale != i && (this._timeScale = i, this._playing)) for (var s = this._items.length, h = 0; h < s; h++) {
                var r = this._items[h];
                r.tweener ? r.tweener.setTimeScale(i) : r.type == e.Transition ? r.value.trans && (r.value.trans.timeScale = i) : r.type == e.Animation && r.target && r.target.setProp(t.ObjectPropID.TimeScale, i);
            }
        }
        updateFromRelations(t, i, s) {
            var h = this._items.length;
            if (0 != h) for (var r = 0; r < h; r++) {
                var a = this._items[r];
                a.type == e.XY && a.targetId == t && (a.tweenConfig ? (a.tweenConfig.startValue.b3 || (a.tweenConfig.startValue.f1 += i, 
                a.tweenConfig.startValue.f2 += s), a.tweenConfig.endValue.b3 || (a.tweenConfig.endValue.f1 += i, 
                a.tweenConfig.endValue.f2 += s)) : a.value.b3 || (a.value.f1 += i, a.value.f2 += s));
            }
        }
        onOwnerAddedToStage() {
            this._autoPlay && !this._playing && this.play(null, this._autoPlayTimes, this._autoPlayDelay);
        }
        onOwnerRemovedFromStage() {
            0 == (this._options & r) && this.stop(0 != (this._options & a), !1);
        }
        onDelayedPlay() {
            if (this.internalPlay(), this._playing = this._totalTasks > 0, this._playing) {
                if (0 != (this._options & h)) for (var t = this._items.length, e = 0; e < t; e++) {
                    var i = this._items[e];
                    i.target && i.target != this._owner && (i.displayLockToken = i.target.addDisplayLock());
                }
            } else if (this._onComplete) {
                var s = this._onComplete;
                this._onComplete = null, s.run();
            }
        }
        internalPlay() {
            this._ownerBaseX = this._owner.x, this._ownerBaseY = this._owner.y, this._totalTasks = 1;
            var t, i = this._items.length, s = !1;
            if (this._reversed) for (h = i - 1; h >= 0; h--) null != (t = this._items[h]).target && this.playItem(t); else for (var h = 0; h < i; h++) null != (t = this._items[h]).target && (t.type == e.Animation && 0 != this._startTime && t.time <= this._startTime ? (s = !0, 
            t.value.flag = !1) : this.playItem(t));
            s && this.skipAnimations(), this._totalTasks--;
        }
        playItem(i) {
            var s;
            if (i.tweenConfig) {
                if (s = this._reversed ? this._totalDuration - i.time - i.tweenConfig.duration : i.time, 
                -1 == this._endTime || s <= this._endTime) {
                    var h, r;
                    switch (this._reversed ? (h = i.tweenConfig.endValue, r = i.tweenConfig.startValue) : (h = i.tweenConfig.startValue, 
                    r = i.tweenConfig.endValue), i.value.b1 = h.b1 || r.b1, i.value.b2 = h.b2 || r.b2, 
                    i.type) {
                      case e.XY:
                      case e.Size:
                      case e.Scale:
                      case e.Skew:
                        i.tweener = t.GTween.to2(h.f1, h.f2, r.f1, r.f2, i.tweenConfig.duration);
                        break;

                      case e.Alpha:
                      case e.Rotation:
                        i.tweener = t.GTween.to(h.f1, r.f1, i.tweenConfig.duration);
                        break;

                      case e.Color:
                        i.tweener = t.GTween.toColor(h.f1, r.f1, i.tweenConfig.duration);
                        break;

                      case e.ColorFilter:
                        i.tweener = t.GTween.to4(h.f1, h.f2, h.f3, h.f4, r.f1, r.f2, r.f3, r.f4, i.tweenConfig.duration);
                    }
                    i.tweener.setDelay(s).setEase(i.tweenConfig.easeType).setRepeat(i.tweenConfig.repeat, i.tweenConfig.yoyo).setTimeScale(this._timeScale).setTarget(i).onStart(this.onTweenStart, this).onUpdate(this.onTweenUpdate, this).onComplete(this.onTweenComplete, this), 
                    this._endTime >= 0 && i.tweener.setBreakpoint(this._endTime - s), this._totalTasks++;
                }
            } else i.type == e.Shake ? (s = this._reversed ? this._totalDuration - i.time - i.value.duration : i.time, 
            i.value.offsetX = i.value.offsetY = 0, i.value.lastOffsetX = i.value.lastOffsetY = 0, 
            i.tweener = t.GTween.shake(0, 0, i.value.amplitude, i.value.duration).setDelay(s).setTimeScale(this._timeScale).setTarget(i).onUpdate(this.onTweenUpdate, this).onComplete(this.onTweenComplete, this), 
            this._endTime >= 0 && i.tweener.setBreakpoint(this._endTime - i.time), this._totalTasks++) : (s = this._reversed ? this._totalDuration - i.time : i.time) <= this._startTime ? (this.applyValue(i), 
            this.callHook(i, !1)) : (-1 == this._endTime || s <= this._endTime) && (this._totalTasks++, 
            i.tweener = t.GTween.delayedCall(s).setTimeScale(this._timeScale).setTarget(i).onComplete(this.onDelayedPlayItem, this));
            i.tweener && i.tweener.seek(this._startTime);
        }
        skipAnimations() {
            for (var i, s, h, r, a, n, o = this._items.length, l = 0; l < o; l++) if (!((n = this._items[l]).type != e.Animation || n.time > this._startTime || (r = n.value).flag)) {
                i = (a = n.target).getProp(t.ObjectPropID.Frame), s = a.getProp(t.ObjectPropID.Playing) ? 0 : -1, 
                h = 0;
                for (var _ = l; _ < o; _++) (n = this._items[_]).type != e.Animation || n.target != a || n.time > this._startTime || ((r = n.value).flag = !0, 
                -1 != r.frame ? (i = r.frame, s = r.playing ? n.time : -1, h = 0) : r.playing ? s < 0 && (s = n.time) : (s >= 0 && (h += n.time - s), 
                s = -1), this.callHook(n, !1));
                s >= 0 && (h += this._startTime - s), a.setProp(t.ObjectPropID.Playing, s >= 0), 
                a.setProp(t.ObjectPropID.Frame, i), h > 0 && a.setProp(t.ObjectPropID.DeltaTime, 1e3 * h);
            }
        }
        onDelayedPlayItem(t) {
            var e = t.target;
            e.tweener = null, this._totalTasks--, this.applyValue(e), this.callHook(e, !1), 
            this.checkAllComplete();
        }
        onTweenStart(t) {
            var i, s, h = t.target;
            h.type != e.XY && h.type != e.Size || (this._reversed ? (i = h.tweenConfig.endValue, 
            s = h.tweenConfig.startValue) : (i = h.tweenConfig.startValue, s = h.tweenConfig.endValue), 
            h.type == e.XY ? h.target != this._owner ? (i.b1 ? i.b3 && (t.startValue.x = i.f1 * this._owner.width) : t.startValue.x = h.target.x, 
            i.b2 ? i.b3 && (t.startValue.y = i.f2 * this._owner.height) : t.startValue.y = h.target.y, 
            s.b1 ? s.b3 && (t.endValue.x = s.f1 * this._owner.width) : t.endValue.x = t.startValue.x, 
            s.b2 ? s.b3 && (t.endValue.y = s.f2 * this._owner.height) : t.endValue.y = t.startValue.y) : (i.b1 || (t.startValue.x = h.target.x - this._ownerBaseX), 
            i.b2 || (t.startValue.y = h.target.y - this._ownerBaseY), s.b1 || (t.endValue.x = t.startValue.x), 
            s.b2 || (t.endValue.y = t.startValue.y)) : (i.b1 || (t.startValue.x = h.target.width), 
            i.b2 || (t.startValue.y = h.target.height), s.b1 || (t.endValue.x = t.startValue.x), 
            s.b2 || (t.endValue.y = t.startValue.y)), h.tweenConfig.path && (h.value.b1 = h.value.b2 = !0, 
            t.setPath(h.tweenConfig.path))), this.callHook(h, !1);
        }
        onTweenUpdate(t) {
            var i = t.target;
            switch (i.type) {
              case e.XY:
              case e.Size:
              case e.Scale:
              case e.Skew:
                i.value.f1 = t.value.x, i.value.f2 = t.value.y, i.tweenConfig.path && (i.value.f1 += t.startValue.x, 
                i.value.f2 += t.startValue.y);
                break;

              case e.Alpha:
              case e.Rotation:
                i.value.f1 = t.value.x;
                break;

              case e.Color:
                i.value.f1 = t.value.color;
                break;

              case e.ColorFilter:
                i.value.f1 = t.value.x, i.value.f2 = t.value.y, i.value.f3 = t.value.z, i.value.f4 = t.value.w;
                break;

              case e.Shake:
                i.value.offsetX = t.deltaValue.x, i.value.offsetY = t.deltaValue.y;
            }
            this.applyValue(i);
        }
        onTweenComplete(t) {
            var e = t.target;
            e.tweener = null, this._totalTasks--, t.allCompleted && this.callHook(e, !0), this.checkAllComplete();
        }
        onPlayTransCompleted(t) {
            this._totalTasks--, this.checkAllComplete();
        }
        callHook(t, e) {
            e ? t.tweenConfig && t.tweenConfig.endHook && t.tweenConfig.endHook.run() : t.time >= this._startTime && t.hook && t.hook.run();
        }
        checkAllComplete() {
            if (this._playing && 0 == this._totalTasks) if (this._totalTimes < 0) this.internalPlay(), 
            0 == this._totalTasks && t.GTween.delayedCall(0).setTarget(this).onComplete(this.checkAllComplete, this); else if (this._totalTimes--, 
            this._totalTimes > 0) this.internalPlay(), 0 == this._totalTasks && t.GTween.delayedCall(0).setTarget(this).onComplete(this.checkAllComplete, this); else {
                this._playing = !1;
                for (var e = this._items.length, i = 0; i < e; i++) {
                    var s = this._items[i];
                    s.target && 0 != s.displayLockToken && (s.target.releaseDisplayLock(s.displayLockToken), 
                    s.displayLockToken = 0);
                }
                if (this._onComplete) {
                    var h = this._onComplete;
                    this._onComplete = null, h.run();
                }
            }
        }
        applyValue(i) {
            i.target._gearLocked = !0;
            var s = i.value;
            switch (i.type) {
              case e.XY:
                i.target == this._owner ? s.b1 && s.b2 ? i.target.setXY(s.f1 + this._ownerBaseX, s.f2 + this._ownerBaseY) : s.b1 ? i.target.x = s.f1 + this._ownerBaseX : i.target.y = s.f2 + this._ownerBaseY : s.b3 ? s.b1 && s.b2 ? i.target.setXY(s.f1 * this._owner.width, s.f2 * this._owner.height) : s.b1 ? i.target.x = s.f1 * this._owner.width : s.b2 && (i.target.y = s.f2 * this._owner.height) : s.b1 && s.b2 ? i.target.setXY(s.f1, s.f2) : s.b1 ? i.target.x = s.f1 : s.b2 && (i.target.y = s.f2);
                break;

              case e.Size:
                s.b1 || (s.f1 = i.target.width), s.b2 || (s.f2 = i.target.height), i.target.setSize(s.f1, s.f2);
                break;

              case e.Pivot:
                i.target.setPivot(s.f1, s.f2, i.target.pivotAsAnchor);
                break;

              case e.Alpha:
                i.target.alpha = s.f1;
                break;

              case e.Rotation:
                i.target.rotation = s.f1;
                break;

              case e.Scale:
                i.target.setScale(s.f1, s.f2);
                break;

              case e.Skew:
                i.target.setSkew(s.f1, s.f2);
                break;

              case e.Color:
                i.target.setProp(t.ObjectPropID.Color, t.ToolSet.convertToHtmlColor(s.f1, !1));
                break;

              case e.Animation:
                s.frame >= 0 && i.target.setProp(t.ObjectPropID.Frame, s.frame), i.target.setProp(t.ObjectPropID.Playing, s.playing), 
                i.target.setProp(t.ObjectPropID.TimeScale, this._timeScale);
                break;

              case e.Visible:
                i.target.visible = s.visible;
                break;

              case e.Transition:
                if (this._playing) {
                    var h = s.trans;
                    if (h) {
                        this._totalTasks++;
                        var r = this._startTime > i.time ? this._startTime - i.time : 0, a = this._endTime >= 0 ? this._endTime - i.time : -1;
                        s.stopTime >= 0 && (a < 0 || a > s.stopTime) && (a = s.stopTime), h.timeScale = this._timeScale, 
                        h._play(Laya.Handler.create(this, this.onPlayTransCompleted, [ i ]), s.playTimes, 0, r, a, this._reversed);
                    }
                }
                break;

              case e.Sound:
                if (this._playing && i.time >= this._startTime) {
                    if (null == s.audioClip) {
                        var n = t.UIPackage.getItemByURL(s.sound);
                        s.audioClip = n ? n.file : s.sound;
                    }
                    s.audioClip && t.GRoot.inst.playOneShotSound(s.audioClip, s.volume);
                }
                break;

              case e.Shake:
                i.target.setXY(i.target.x - s.lastOffsetX + s.offsetX, i.target.y - s.lastOffsetY + s.offsetY), 
                s.lastOffsetX = s.offsetX, s.lastOffsetY = s.offsetY;
                break;

              case e.ColorFilter:
                t.ToolSet.setColorFilter(i.target.displayObject, [ s.f1, s.f2, s.f3, s.f4 ]);
                break;

              case e.Text:
                i.target.text = s.text;
                break;

              case e.Icon:
                i.target.icon = s.text;
            }
            i.target._gearLocked = !1;
        }
        setup(e) {
            this.name = e.readS(), this._options = e.getInt32(), this._autoPlay = e.readBool(), 
            this._autoPlayTimes = e.getInt32(), this._autoPlayDelay = e.getFloat32();
            for (var h = e.getInt16(), r = 0; r < h; r++) {
                var a = e.getInt16(), n = e.pos;
                e.seek(n, 0);
                var o = new i(e.readByte());
                this._items[r] = o, o.time = e.getFloat32();
                var l = e.getInt16();
                if (o.targetId = l < 0 ? "" : this._owner.getChildAt(l).id, o.label = e.readS(), 
                e.readBool()) {
                    if (e.seek(n, 1), o.tweenConfig = new s(), o.tweenConfig.duration = e.getFloat32(), 
                    o.time + o.tweenConfig.duration > this._totalDuration && (this._totalDuration = o.time + o.tweenConfig.duration), 
                    o.tweenConfig.easeType = e.readByte(), o.tweenConfig.repeat = e.getInt32(), o.tweenConfig.yoyo = e.readBool(), 
                    o.tweenConfig.endLabel = e.readS(), e.seek(n, 2), this.decodeValue(o, e, o.tweenConfig.startValue), 
                    e.seek(n, 3), this.decodeValue(o, e, o.tweenConfig.endValue), e.version >= 2) {
                        var _ = e.getInt32();
                        if (_ > 0) {
                            o.tweenConfig.path = new t.GPath();
                            for (var d = new Array(), c = 0; c < _; c++) {
                                var u = e.getUint8();
                                switch (u) {
                                  case t.CurveType.Bezier:
                                    d.push(t.GPathPoint.newBezierPoint(e.getFloat32(), e.getFloat32(), e.getFloat32(), e.getFloat32()));
                                    break;

                                  case t.CurveType.CubicBezier:
                                    d.push(t.GPathPoint.newCubicBezierPoint(e.getFloat32(), e.getFloat32(), e.getFloat32(), e.getFloat32(), e.getFloat32(), e.getFloat32()));
                                    break;

                                  default:
                                    d.push(t.GPathPoint.newPoint(e.getFloat32(), e.getFloat32(), u));
                                }
                            }
                            o.tweenConfig.path.create(d);
                        }
                    }
                } else o.time > this._totalDuration && (this._totalDuration = o.time), e.seek(n, 2), 
                this.decodeValue(o, e, o.value);
                e.pos = n + a;
            }
        }
        decodeValue(t, i, s) {
            switch (t.type) {
              case e.XY:
              case e.Size:
              case e.Pivot:
              case e.Skew:
                s.b1 = i.readBool(), s.b2 = i.readBool(), s.f1 = i.getFloat32(), s.f2 = i.getFloat32(), 
                i.version >= 2 && t.type == e.XY && (s.b3 = i.readBool());
                break;

              case e.Alpha:
              case e.Rotation:
                s.f1 = i.getFloat32();
                break;

              case e.Scale:
                s.f1 = i.getFloat32(), s.f2 = i.getFloat32();
                break;

              case e.Color:
                s.f1 = i.readColor();
                break;

              case e.Animation:
                s.playing = i.readBool(), s.frame = i.getInt32();
                break;

              case e.Visible:
                s.visible = i.readBool();
                break;

              case e.Sound:
                s.sound = i.readS(), s.volume = i.getFloat32();
                break;

              case e.Transition:
                s.transName = i.readS(), s.playTimes = i.getInt32();
                break;

              case e.Shake:
                s.amplitude = i.getFloat32(), s.duration = i.getFloat32();
                break;

              case e.ColorFilter:
                s.f1 = i.getFloat32(), s.f2 = i.getFloat32(), s.f3 = i.getFloat32(), s.f4 = i.getFloat32();
                break;

              case e.Text:
              case e.Icon:
                s.text = i.readS();
            }
        }
    };
    class e {}
    e.XY = 0, e.Size = 1, e.Scale = 2, e.Pivot = 3, e.Alpha = 4, e.Rotation = 5, e.Color = 6, 
    e.Animation = 7, e.Visible = 8, e.Sound = 9, e.Transition = 10, e.Shake = 11, e.ColorFilter = 12, 
    e.Skew = 13, e.Text = 14, e.Icon = 15, e.Unknown = 16;
    class i {
        constructor(t) {
            this.type = t, this.value = {}, this.displayLockToken = 0;
        }
    }
    class s {
        constructor() {
            this.easeType = t.EaseType.QuadOut, this.startValue = {
                b1: !0,
                b2: !0
            }, this.endValue = {
                b1: !0,
                b2: !0
            };
        }
    }
    const h = 1, r = 2, a = 4;
}(fgui), function(t) {
    class e {
        constructor() {}
        static loadFromXML(t) {
            let i = {};
            e.strings = i;
            for (var s = function(t, e) {
                var i = t.childNodes, s = i.length;
                if (s > 0) for (var h = 0; h < s; h++) {
                    var r = i[h];
                    if (r.nodeName == e) return r;
                }
                return null;
            }(Laya.Utils.parseXMLFromString(t), "resources").childNodes, h = s.length, r = 0; r < h; r++) {
                var a = s[r];
                if ("string" == a.nodeName) {
                    var n = a.getAttribute("name"), o = a.textContent, l = n.indexOf("-");
                    if (-1 == l) continue;
                    var _ = n.substr(0, l), d = n.substr(l + 1), c = i[_];
                    c || (c = {}, i[_] = c), c[d] = o;
                }
            }
        }
        static translateComponent(i) {
            if (null != e.strings) {
                var s = e.strings[i.owner.id + i.id];
                if (null != s) {
                    var h, r, a, n, o, l, _, d, c, u = i.rawData;
                    u.seek(0, 2);
                    var g = u.getInt16();
                    for (o = 0; o < g; o++) {
                        _ = u.getInt16(), d = u.pos, u.seek(d, 0);
                        var p = u.readByte(), f = p;
                        u.skip(4), h = u.readS(), f == t.ObjectType.Component && u.seek(d, 6) && (f = u.readByte()), 
                        u.seek(d, 1), null != (r = s[h + "-tips"]) && u.writeS(r), u.seek(d, 2);
                        var y = u.getInt16();
                        for (l = 0; l < y; l++) {
                            if (a = u.getInt16(), a += u.pos, 6 == u.readByte()) {
                                for (u.skip(2), c = u.getInt16(), v = 0; v < c; v++) null != u.readS() && (null != (r = s[h + "-texts_" + v]) ? u.writeS(r) : u.skip(2));
                                u.readBool() && null != (r = s[h + "-texts_def"]) && u.writeS(r);
                            }
                            u.pos = a;
                        }
                        if (p == t.ObjectType.Component && u.version >= 2) {
                            u.seek(d, 4), u.skip(2), u.skip(4 * u.getUint16());
                            for (var m = u.getUint16(), v = 0; v < m; v++) {
                                var w = u.readS();
                                0 == u.getUint16() && null != (r = s[h + "-cp-" + w]) ? u.writeS(r) : u.skip(2);
                            }
                        }
                        switch (f) {
                          case t.ObjectType.Text:
                          case t.ObjectType.RichText:
                          case t.ObjectType.InputText:
                            null != (r = s[h]) && (u.seek(d, 6), u.writeS(r)), null != (r = s[h + "-prompt"]) && (u.seek(d, 4), 
                            u.writeS(r));
                            break;

                          case t.ObjectType.List:
                          case t.ObjectType.Tree:
                            for (u.seek(d, 8), u.skip(2), n = u.getUint16(), l = 0; l < n; l++) {
                                if (a = u.getUint16(), a += u.pos, u.skip(2), f == t.ObjectType.Tree && u.skip(2), 
                                null != (r = s[h + "-" + l]) ? u.writeS(r) : u.skip(2), null != (r = s[h + "-" + l + "-0"]) ? u.writeS(r) : u.skip(2), 
                                u.version >= 2) {
                                    u.skip(6), u.skip(4 * u.getUint16());
                                    for (m = u.getUint16(), v = 0; v < m; v++) {
                                        w = u.readS();
                                        0 == u.getUint16() && null != (r = s[h + "-" + l + "-" + w]) ? u.writeS(r) : u.skip(2);
                                    }
                                }
                                u.pos = a;
                            }
                            break;

                          case t.ObjectType.Label:
                            u.seek(d, 6) && u.readByte() == f && (null != (r = s[h]) ? u.writeS(r) : u.skip(2), 
                            u.skip(2), u.readBool() && u.skip(4), u.skip(4), u.readBool() && null != (r = s[h + "-prompt"]) && u.writeS(r));
                            break;

                          case t.ObjectType.Button:
                            u.seek(d, 6) && u.readByte() == f && (null != (r = s[h]) ? u.writeS(r) : u.skip(2), 
                            null != (r = s[h + "-0"]) && u.writeS(r));
                            break;

                          case t.ObjectType.ComboBox:
                            if (u.seek(d, 6) && u.readByte() == f) {
                                for (n = u.getInt16(), l = 0; l < n; l++) a = u.getInt16(), a += u.pos, null != (r = s[h + "-" + l]) && u.writeS(r), 
                                u.pos = a;
                                null != (r = s[h]) && u.writeS(r);
                            }
                        }
                        u.pos = d + _;
                    }
                }
            }
        }
    }
    t.TranslationHelper = e;
}(fgui), function(t) {
    class e {
        constructor() {}
    }
    e.defaultFont = "SimSun", e.modalLayerColor = "rgba(33,33,33,0.2)", e.buttonSoundVolumeScale = 1, 
    e.defaultScrollStep = 25, e.defaultScrollDecelerationRate = .967, e.defaultScrollBarDisplay = t.ScrollBarDisplayType.Visible, 
    e.defaultScrollTouchEffect = !0, e.defaultScrollBounceEffect = !0, e.defaultScrollSnappingThreshold = .1, 
    e.defaultScrollPagingThreshold = .3, e.defaultComboBoxVisibleItemCount = 10, e.touchScrollSensitivity = 20, 
    e.touchDragSensitivity = 10, e.clickDragSensitivity = 2, e.bringWindowToFrontOnClick = !0, 
    e.frameTimeForAsyncUIConstruction = 2, e.textureLinearSampling = !0, e.packageFileExtension = "fui", 
    t.UIConfig = e;
}(fgui), function(t) {
    class e {
        constructor() {}
        static setExtension(i, s) {
            if (null == i) throw "Invaild url: " + i;
            var h = t.UIPackage.getItemByURL(i);
            h && (h.extensionType = s), e.extensions[i] = s;
        }
        static setPackageItemExtension(t, i) {
            e.setExtension(t, i);
        }
        static setLoaderExtension(t) {
            e.loaderType = t;
        }
        static resolvePackageItemExtension(t) {
            var i = e.extensions["ui://" + t.owner.id + t.id];
            i || (i = e.extensions["ui://" + t.owner.name + "/" + t.name]), i && (t.extensionType = i);
        }
        static newObject(i, s) {
            var h;
            if ("number" == typeof i) switch (i) {
              case t.ObjectType.Image:
                return new t.GImage();

              case t.ObjectType.MovieClip:
                return new t.GMovieClip();

              case t.ObjectType.Component:
                return new t.GComponent();

              case t.ObjectType.Text:
                return new t.GBasicTextField();

              case t.ObjectType.RichText:
                return new t.GRichTextField();

              case t.ObjectType.InputText:
                return new t.GTextInput();

              case t.ObjectType.Group:
                return new t.GGroup();

              case t.ObjectType.List:
                return new t.GList();

              case t.ObjectType.Graph:
                return new t.GGraph();

              case t.ObjectType.Loader:
                return e.loaderType ? new e.loaderType() : new t.GLoader();

              case t.ObjectType.Button:
                return new t.GButton();

              case t.ObjectType.Label:
                return new t.GLabel();

              case t.ObjectType.ProgressBar:
                return new t.GProgressBar();

              case t.ObjectType.Slider:
                return new t.GSlider();

              case t.ObjectType.ScrollBar:
                return new t.GScrollBar();

              case t.ObjectType.ComboBox:
                return new t.GComboBox();

              case t.ObjectType.Tree:
                return new t.GTree();

              case t.ObjectType.Loader3D:
                return new t.GLoader3D();

              default:
                return null;
            } else (h = i.type == t.PackageItemType.Component ? s ? new s() : i.extensionType ? new i.extensionType() : e.newObject(i.objectType) : e.newObject(i.objectType)) && (h.packageItem = i);
            return h;
        }
    }
    e.extensions = {}, t.UIObjectFactory = e;
}(fgui), function(t) {
    class e {
        constructor() {
            this._items = [], this._itemsById = {}, this._itemsByName = {}, this._sprites = {}, 
            this._dependencies = [], this._branches = [], this._branchIndex = -1;
        }
        static get branch() {
            return e._branch;
        }
        static set branch(t) {
            for (var i in e._branch = t, e._instById) {
                var s = e._instById[i];
                s._branches && (s._branchIndex = s._branches.indexOf(t));
            }
        }
        static getVar(t) {
            return e._vars[t];
        }
        static setVar(t, i) {
            e._vars[t] = i;
        }
        static getById(t) {
            return e._instById[t];
        }
        static getByName(t) {
            return e._instByName[t];
        }
        static addPackage(i, s) {
            if (!(s || (s = t.AssetProxy.inst.getRes(i + "." + t.UIConfig.packageFileExtension)) && 0 != s.byteLength)) throw new Error("resource '" + i + "' not found");
            var h = new t.ByteBuffer(s), r = new e();
            return r._resKey = i, r.loadPackage(h), e._instById[r.id] = r, e._instByName[r.name] = r, 
            e._instById[i] = r, r;
        }
        static loadPackage(i, s, h) {
            let r, a = [], n = [];
            if (Array.isArray(i)) for (r = 0; r < i.length; r++) a.push({
                url: i[r] + "." + t.UIConfig.packageFileExtension,
                type: Laya.Loader.BUFFER
            }), n.push(i[r]); else a = [ {
                url: i + "." + t.UIConfig.packageFileExtension,
                type: Laya.Loader.BUFFER
            } ], n = [ i ];
            let o, l = [];
            for (r = 0; r < a.length; r++) (o = e._instById[n[r]]) && (l.push(o), a.splice(r, 1), 
            n.splice(r, 1), r--);
            if (0 != a.length) {
                var _ = Laya.Handler.create(this, function() {
                    let i, o = [];
                    for (r = 0; r < a.length; r++) {
                        let s = t.AssetProxy.inst.getRes(a[r].url);
                        if (s) {
                            i = new e(), l.push(i), i._resKey = n[r], i.loadPackage(new t.ByteBuffer(s));
                            let h = i._items.length;
                            for (let e = 0; e < h; e++) {
                                let s = i._items[e];
                                s.type == t.PackageItemType.Atlas ? o.push({
                                    url: s.file,
                                    type: Laya.Loader.IMAGE
                                }) : s.type == t.PackageItemType.Sound && o.push({
                                    url: s.file,
                                    type: Laya.Loader.SOUND
                                });
                            }
                        }
                    }
                    if (o.length > 0) t.AssetProxy.inst.load(o, Laya.Handler.create(this, function() {
                        for (r = 0; r < l.length; r++) i = l[r], e._instById[i.id] || (e._instById[i.id] = i, 
                        e._instByName[i.name] = i, e._instByName[i._resKey] = i);
                        s.runWith([ l ]);
                    }, null, !0), h); else {
                        for (r = 0; r < l.length; r++) i = l[r], e._instById[i.id] || (e._instById[i.id] = i, 
                        e._instByName[i.name] = i, e._instByName[i._resKey] = i);
                        s.runWith([ l ]);
                    }
                }, null, !0);
                t.AssetProxy.inst.load(a, _, null, Laya.Loader.BUFFER);
            } else s.runWith([ l ]);
        }
        static removePackage(t) {
            var i = e._instById[t];
            if (i || (i = e._instByName[t]), !i) throw new Error("unknown package: " + t);
            i.dispose(), delete e._instById[i.id], delete e._instByName[i.name], delete e._instById[i._resKey], 
            i._customId && delete e._instById[i._customId];
        }
        static createObject(t, i, s) {
            var h = e.getByName(t);
            return h ? h.createObject(i, s) : null;
        }
        static createObjectFromURL(t, i) {
            var s = e.getItemByURL(t);
            return s ? s.owner.internalCreateObject(s, i) : null;
        }
        static getItemURL(t, i) {
            var s = e.getByName(t);
            if (!s) return null;
            var h = s._itemsByName[i];
            return h ? "ui://" + s.id + h.id : null;
        }
        static getItemByURL(t) {
            var i = t.indexOf("//");
            if (-1 == i) return null;
            var s = t.indexOf("/", i + 2);
            if (-1 == s) {
                if (t.length > 13) {
                    var h = t.substr(5, 8), r = e.getById(h);
                    if (r) {
                        var a = t.substr(13);
                        return r.getItemById(a);
                    }
                }
            } else {
                var n = t.substr(i + 2, s - i - 2);
                if (r = e.getByName(n)) {
                    var o = t.substr(s + 1);
                    return r.getItemByName(o);
                }
            }
            return null;
        }
        static getItemAssetByURL(t) {
            var i = e.getItemByURL(t);
            return null == i ? null : i.owner.getItemAsset(i);
        }
        static normalizeURL(t) {
            if (null == t) return null;
            var i = t.indexOf("//");
            if (-1 == i) return null;
            var s = t.indexOf("/", i + 2);
            if (-1 == s) return t;
            var h = t.substr(i + 2, s - i - 2), r = t.substr(s + 1);
            return e.getItemURL(h, r);
        }
        static setStringsSource(e) {
            t.TranslationHelper.loadFromXML(e);
        }
        loadPackage(i) {
            if (1179080009 != i.getUint32()) throw new Error("FairyGUI: old package format found in '" + this._resKey + "'");
            i.version = i.getInt32();
            var s = i.readBool();
            if (this._id = i.readUTFString(), this._name = i.readUTFString(), i.skip(20), s) {
                var h = new Uint8Array(i.buffer, i.pos, i.length - i.pos);
                h = new Zlib.RawInflate(h).decompress();
                let e = new t.ByteBuffer(h);
                e.version = i.version, i = e;
            }
            var r, a, n, o, l, _ = i.version >= 2, d = i.pos;
            i.seek(d, 4), r = i.getInt32();
            var c, u = [];
            for (a = 0; a < r; a++) u[a] = i.readUTFString();
            for (i.stringTable = u, i.seek(d, 0), r = i.getInt16(), a = 0; a < r; a++) this._dependencies.push({
                id: i.readS(),
                name: i.readS()
            });
            _ && ((r = i.getInt16()) > 0 && (this._branches = i.readSArray(r), e._branch && (this._branchIndex = this._branches.indexOf(e._branch))), 
            l = r > 0), i.seek(d, 1);
            var g = this._resKey;
            let p = g.lastIndexOf("/"), f = -1 == p ? "" : g.substr(0, p + 1);
            for (g += "_", r = i.getUint16(), a = 0; a < r; a++) {
                switch (n = i.getInt32(), n += i.pos, (c = new t.PackageItem()).owner = this, c.type = i.readByte(), 
                c.id = i.readS(), c.name = i.readS(), i.readS(), (o = i.readS()) && (c.file = o), 
                i.readBool(), c.width = i.getInt32(), c.height = i.getInt32(), c.type) {
                  case t.PackageItemType.Image:
                    c.objectType = t.ObjectType.Image;
                    var y = i.readByte();
                    1 == y ? (c.scale9Grid = new Laya.Rectangle(), c.scale9Grid.x = i.getInt32(), c.scale9Grid.y = i.getInt32(), 
                    c.scale9Grid.width = i.getInt32(), c.scale9Grid.height = i.getInt32(), c.tileGridIndice = i.getInt32()) : 2 == y && (c.scaleByTile = !0), 
                    c.smoothing = i.readBool();
                    break;

                  case t.PackageItemType.MovieClip:
                    c.smoothing = i.readBool(), c.objectType = t.ObjectType.MovieClip, c.rawData = i.readBuffer();
                    break;

                  case t.PackageItemType.Font:
                    c.rawData = i.readBuffer();
                    break;

                  case t.PackageItemType.Component:
                    var m = i.readByte();
                    c.objectType = m > 0 ? m : t.ObjectType.Component, c.rawData = i.readBuffer(), t.UIObjectFactory.resolvePackageItemExtension(c);
                    break;

                  case t.PackageItemType.Atlas:
                  case t.PackageItemType.Sound:
                  case t.PackageItemType.Misc:
                    c.file = g + c.file;
                    break;

                  case t.PackageItemType.Spine:
                  case t.PackageItemType.DragonBones:
                    c.file = f + c.file, c.skeletonAnchor = new Laya.Point(), c.skeletonAnchor.x = i.getFloat32(), 
                    c.skeletonAnchor.y = i.getFloat32();
                }
                if (_) {
                    (o = i.readS()) && (c.name = o + "/" + c.name);
                    var v = i.getUint8();
                    v > 0 && (l ? c.branches = i.readSArray(v) : this._itemsById[i.readS()] = c);
                    var w = i.getUint8();
                    w > 0 && (c.highResolution = i.readSArray(w));
                }
                this._items.push(c), this._itemsById[c.id] = c, null != c.name && (this._itemsByName[c.name] = c), 
                i.pos = n;
            }
            for (i.seek(d, 2), r = i.getUint16(), a = 0; a < r; a++) {
                n = i.getUint16(), n += i.pos;
                var C = i.readS();
                let t = {
                    atlas: c = this._itemsById[i.readS()],
                    rect: new Laya.Rectangle(),
                    offset: new Laya.Point(),
                    originalSize: new Laya.Point()
                };
                t.atlas = c, t.rect.x = i.getInt32(), t.rect.y = i.getInt32(), t.rect.width = i.getInt32(), 
                t.rect.height = i.getInt32(), t.rotated = i.readBool(), _ && i.readBool() ? (t.offset.x = i.getInt32(), 
                t.offset.y = i.getInt32(), t.originalSize.x = i.getInt32(), t.originalSize.y = i.getInt32()) : (t.originalSize.x = t.rect.width, 
                t.originalSize.y = t.rect.height), this._sprites[C] = t, i.pos = n;
            }
            if (i.seek(d, 3)) for (r = i.getUint16(), a = 0; a < r; a++) n = i.getInt32(), n += i.pos, 
            (c = this._itemsById[i.readS()]) && c.type == t.PackageItemType.Image && (c.pixelHitTestData = new t.PixelHitTestData(), 
            c.pixelHitTestData.load(i)), i.pos = n;
        }
        loadAllAssets() {
            for (var t = this._items.length, e = 0; e < t; e++) {
                var i = this._items[e];
                this.getItemAsset(i);
            }
        }
        unloadAssets() {
            for (var e = this._items.length, i = 0; i < e; i++) {
                var s = this._items[i];
                s.type == t.PackageItemType.Atlas && s.texture && Laya.loader.clearTextureRes(s.texture.url);
            }
        }
        dispose() {
            for (var e = this._items.length, i = 0; i < e; i++) {
                var s = this._items[i];
                s.type == t.PackageItemType.Atlas ? s.texture && (s.texture.destroy(), s.texture = null) : s.type == t.PackageItemType.Sound ? Laya.SoundManager.destroySound(s.file) : s.templet && s.templet.destroy();
            }
        }
        get id() {
            return this._id;
        }
        get name() {
            return this._name;
        }
        get customId() {
            return this._customId;
        }
        set customId(t) {
            this._customId && delete e._instById[this._customId], this._customId = t, this._customId && (e._instById[this._customId] = this);
        }
        createObject(t, e) {
            var i = this._itemsByName[t];
            return i ? this.internalCreateObject(i, e) : null;
        }
        internalCreateObject(i, s) {
            var h = t.UIObjectFactory.newObject(i, s);
            return null == h ? null : (e._constructing++, h.constructFromResource(), e._constructing--, 
            h);
        }
        getItemById(t) {
            return this._itemsById[t];
        }
        getItemByName(t) {
            return this._itemsByName[t];
        }
        getItemAssetByName(t) {
            var e = this._itemsByName[t];
            if (null == e) throw "Resource not found -" + t;
            return this.getItemAsset(e);
        }
        getItemAsset(e) {
            switch (e.type) {
              case t.PackageItemType.Image:
                if (!e.decoded) {
                    e.decoded = !0;
                    var i = this._sprites[e.id];
                    if (i) {
                        var s = this.getItemAsset(i.atlas);
                        e.texture = Laya.Texture.create(s, i.rect.x, i.rect.y, i.rect.width, i.rect.height, i.offset.x, i.offset.y, i.originalSize.x, i.originalSize.y);
                    } else e.texture = null;
                }
                return e.texture;

              case t.PackageItemType.Atlas:
                return e.decoded || (e.decoded = !0, e.texture = t.AssetProxy.inst.getRes(e.file)), 
                e.texture;

              case t.PackageItemType.Font:
                return e.decoded || (e.decoded = !0, this.loadFont(e)), e.bitmapFont;

              case t.PackageItemType.MovieClip:
                return e.decoded || (e.decoded = !0, this.loadMovieClip(e)), e.frames;

              case t.PackageItemType.Component:
                return e.rawData;

              case t.PackageItemType.Misc:
                return e.file ? t.AssetProxy.inst.getRes(e.file) : null;

              default:
                return null;
            }
        }
        getItemAssetAsync(e, i) {
            if (e.decoded) i(null, e); else if (e.loading) e.loading.push(i); else switch (e.type) {
              case t.PackageItemType.Spine:
              case t.PackageItemType.DragonBones:
                e.loading = [ i ], e.templet = new Laya.Templet(), e.templet.on(Laya.Event.COMPLETE, this, () => {
                    let t = e.loading;
                    delete e.loading, t.forEach(t => t(null, e));
                }), e.templet.on(Laya.Event.ERROR, this, () => {
                    let t = e.loading;
                    delete e.loading, delete e.templet, t.forEach(t => t("parse error", e));
                });
                let s = e.file.lastIndexOf("."), h = e.file.substring(0, s + 1).replace("_ske", "") + "sk";
                e.templet.loadAni(h);
                break;

              default:
                this.getItemAsset(e), i(null, e);
            }
        }
        loadMovieClip(t) {
            var e = t.rawData;
            e.seek(0, 0), t.interval = e.getInt32(), t.swing = e.readBool(), t.repeatDelay = e.getInt32(), 
            e.seek(0, 1);
            var i, s, h, r, a = e.getInt16();
            t.frames = [];
            for (var n = 0; n < a; n++) {
                var o = e.getInt16();
                o += e.pos, h = e.getInt32(), r = e.getInt32(), e.getInt32(), e.getInt32();
                let a = {
                    addDelay: e.getInt32()
                };
                if (null != (i = e.readS()) && null != (s = this._sprites[i])) {
                    var l = this.getItemAsset(s.atlas);
                    a.texture = Laya.Texture.create(l, s.rect.x, s.rect.y, s.rect.width, s.rect.height, h, r, t.width, t.height);
                }
                t.frames[n] = a, e.pos = o;
            }
        }
        loadFont(e) {
            e = e.getBranch();
            var i = new t.BitmapFont();
            e.bitmapFont = i;
            var s = e.rawData;
            s.seek(0, 0), i.ttf = s.readBool(), i.tint = s.readBool(), i.resizable = s.readBool(), 
            s.readBool(), i.size = s.getInt32();
            var h = s.getInt32(), r = s.getInt32(), a = null, n = this._sprites[e.id];
            n && (a = this.getItemAsset(n.atlas)), s.seek(0, 1);
            for (var o = null, l = s.getInt32(), _ = 0; _ < l; _++) {
                var d = s.getInt16();
                d += s.pos, o = {};
                var c = s.readChar();
                i.glyphs[c] = o;
                var u = s.readS(), g = s.getInt32(), p = s.getInt32();
                if (o.x = s.getInt32(), o.y = s.getInt32(), o.width = s.getInt32(), o.height = s.getInt32(), 
                o.advance = s.getInt32(), o.channel = s.readByte(), 1 == o.channel ? o.channel = 3 : 2 == o.channel ? o.channel = 2 : 3 == o.channel && (o.channel = 1), 
                i.ttf) o.texture = Laya.Texture.create(a, g + n.rect.x, p + n.rect.y, o.width, o.height), 
                o.lineHeight = r; else {
                    var f = this._itemsById[u];
                    f && (f = f.getBranch(), o.width = f.width, o.height = f.height, f = f.getHighResolution(), 
                    this.getItemAsset(f), o.texture = f.texture), 0 == o.advance && (o.advance = 0 == h ? o.x + o.width : h), 
                    o.lineHeight = o.y < 0 ? o.height : o.y + o.height, o.lineHeight < i.size && (o.lineHeight = i.size);
                }
                s.pos = d;
            }
        }
    }
    e._constructing = 0, e._instById = {}, e._instByName = {}, e._branch = "", e._vars = {}, 
    t.UIPackage = e;
}(fgui), function(t) {
    t.Window = class extends t.GComponent {
        constructor() {
            super(), this._requestingCmd = 0, this._uiSources = [], this.bringToFontOnClick = t.UIConfig.bringWindowToFrontOnClick, 
            this.displayObject.on(Laya.Event.DISPLAY, this, this.__onShown), this.displayObject.on(Laya.Event.UNDISPLAY, this, this.__onHidden), 
            this.displayObject.on(Laya.Event.MOUSE_DOWN, this, this.__mouseDown);
        }
        addUISource(t) {
            this._uiSources.push(t);
        }
        set contentPane(e) {
            this._contentPane != e && (this._contentPane && this.removeChild(this._contentPane), 
            this._contentPane = e, this._contentPane && (this.addChild(this._contentPane), this.setSize(this._contentPane.width, this._contentPane.height), 
            this._contentPane.addRelation(this, t.RelationType.Size), this._frame = this._contentPane.getChild("frame"), 
            this._frame && (this.closeButton = this._frame.getChild("closeButton"), this.dragArea = this._frame.getChild("dragArea"), 
            this.contentArea = this._frame.getChild("contentArea"))));
        }
        get contentPane() {
            return this._contentPane;
        }
        get frame() {
            return this._frame;
        }
        get closeButton() {
            return this._closeButton;
        }
        set closeButton(t) {
            this._closeButton && this._closeButton.offClick(this, this.closeEventHandler), this._closeButton = t, 
            this._closeButton && this._closeButton.onClick(this, this.closeEventHandler);
        }
        get dragArea() {
            return this._dragArea;
        }
        set dragArea(e) {
            this._dragArea != e && (this._dragArea && (this._dragArea.draggable = !1, this._dragArea.off(t.Events.DRAG_START, this, this.__dragStart)), 
            this._dragArea = e, this._dragArea && (this._dragArea instanceof t.GGraph && this._dragArea.asGraph.drawRect(0, null, null), 
            this._dragArea.draggable = !0, this._dragArea.on(t.Events.DRAG_START, this, this.__dragStart)));
        }
        get contentArea() {
            return this._contentArea;
        }
        set contentArea(t) {
            this._contentArea = t;
        }
        show() {
            t.GRoot.inst.showWindow(this);
        }
        showOn(t) {
            t.showWindow(this);
        }
        hide() {
            this.isShowing && this.doHideAnimation();
        }
        hideImmediately() {
            var e = this.parent instanceof t.GRoot ? this.parent : null;
            e || (e = t.GRoot.inst), e.hideWindowImmediately(this);
        }
        centerOn(e, i) {
            this.setXY(Math.round((e.width - this.width) / 2), Math.round((e.height - this.height) / 2)), 
            i && (this.addRelation(e, t.RelationType.Center_Center), this.addRelation(e, t.RelationType.Middle_Middle));
        }
        toggleStatus() {
            this.isTop ? this.hide() : this.show();
        }
        get isShowing() {
            return null != this.parent;
        }
        get isTop() {
            return null != this.parent && this.parent.getChildIndex(this) == this.parent.numChildren - 1;
        }
        get modal() {
            return this._modal;
        }
        set modal(t) {
            this._modal = t;
        }
        bringToFront() {
            this.root.bringToFront(this);
        }
        showModalWait(e) {
            null != e && (this._requestingCmd = e), t.UIConfig.windowModalWaiting && (this._modalWaitPane || (this._modalWaitPane = t.UIPackage.createObjectFromURL(t.UIConfig.windowModalWaiting)), 
            this.layoutModalWaitPane(), this.addChild(this._modalWaitPane));
        }
        layoutModalWaitPane() {
            if (this._contentArea) {
                var t = this._frame.localToGlobal();
                t = this.globalToLocal(t.x, t.y, t), this._modalWaitPane.setXY(t.x + this._contentArea.x, t.y + this._contentArea.y), 
                this._modalWaitPane.setSize(this._contentArea.width, this._contentArea.height);
            } else this._modalWaitPane.setSize(this.width, this.height);
        }
        closeModalWait(t) {
            return (null == t || this._requestingCmd == t) && (this._requestingCmd = 0, this._modalWaitPane && null != this._modalWaitPane.parent && this.removeChild(this._modalWaitPane), 
            !0);
        }
        get modalWaiting() {
            return this._modalWaitPane && null != this._modalWaitPane.parent;
        }
        init() {
            if (!this._inited && !this._loading) if (this._uiSources.length > 0) {
                this._loading = !1;
                for (var t = this._uiSources.length, e = 0; e < t; e++) {
                    var i = this._uiSources[e];
                    i.loaded || (i.load(this.__uiLoadComplete, this), this._loading = !0);
                }
                this._loading || this._init();
            } else this._init();
        }
        onInit() {}
        onShown() {}
        onHide() {}
        doShowAnimation() {
            this.onShown();
        }
        doHideAnimation() {
            this.hideImmediately();
        }
        __uiLoadComplete() {
            for (var t = this._uiSources.length, e = 0; e < t; e++) if (!this._uiSources[e].loaded) return;
            this._loading = !1, this._init();
        }
        _init() {
            this._inited = !0, this.onInit(), this.isShowing && this.doShowAnimation();
        }
        dispose() {
            this.parent && this.hideImmediately(), super.dispose();
        }
        closeEventHandler() {
            this.hide();
        }
        __onShown() {
            this._inited ? this.doShowAnimation() : this.init();
        }
        __onHidden() {
            this.closeModalWait(), this.onHide();
        }
        __mouseDown() {
            this.isShowing && this.bringToFontOnClick && this.bringToFront();
        }
        __dragStart(e) {
            t.GObject.cast(e.currentTarget).stopDrag(), this.startDrag();
        }
    };
}(fgui), function(t) {
    t.ControllerAction = class {
        constructor() {}
        static createAction(e) {
            switch (e) {
              case 0:
                return new t.PlayTransitionAction();

              case 1:
                return new t.ChangePageAction();
            }
            return null;
        }
        run(t, e, i) {
            null != this.fromPage && 0 != this.fromPage.length && -1 == this.fromPage.indexOf(e) || null != this.toPage && 0 != this.toPage.length && -1 == this.toPage.indexOf(i) ? this.leave(t) : this.enter(t);
        }
        enter(t) {}
        leave(t) {}
        setup(t) {
            var e, i;
            for (e = t.getInt16(), this.fromPage = [], i = 0; i < e; i++) this.fromPage[i] = t.readS();
            for (e = t.getInt16(), this.toPage = [], i = 0; i < e; i++) this.toPage[i] = t.readS();
        }
    };
}(fgui), function(t) {
    t.ChangePageAction = class extends t.ControllerAction {
        constructor() {
            super();
        }
        enter(t) {
            var e;
            if (this.controllerName && (e = this.objectId ? t.parent.getChildById(this.objectId) : t.parent)) {
                var i = e.getController(this.controllerName);
                i && i != t && !i.changing && ("~1" == this.targetPage ? t.selectedIndex < i.pageCount && (i.selectedIndex = t.selectedIndex) : "~2" == this.targetPage ? i.selectedPage = t.selectedPage : i.selectedPageId = this.targetPage);
            }
        }
        setup(t) {
            super.setup(t), this.objectId = t.readS(), this.controllerName = t.readS(), this.targetPage = t.readS();
        }
    };
}(fgui), function(t) {
    t.PlayTransitionAction = class extends t.ControllerAction {
        constructor() {
            super();
        }
        enter(t) {
            var e = t.parent.getTransition(this.transitionName);
            e && (this._currentTransition && this._currentTransition.playing ? e.changePlayTimes(this.playTimes) : e.play(null, this.playTimes, this.delay), 
            this._currentTransition = e);
        }
        leave(t) {
            this.stopOnExit && this._currentTransition && (this._currentTransition.stop(), this._currentTransition = null);
        }
        setup(t) {
            super.setup(t), this.transitionName = t.readS(), this.playTimes = t.getInt32(), 
            this.delay = t.getFloat32(), this.stopOnExit = t.readBool();
        }
    };
}(fgui), function(t) {
    t.BitmapFont = class {
        constructor() {
            this.size = 0, this.glyphs = {};
        }
    };
}(fgui), function(t) {
    function fillRadial90(e, i, s, h, r) {
        var a, n, o;
        switch ((!h || s != t.FillOrigin.TopRight && s != t.FillOrigin.BottomLeft) && (h || s != t.FillOrigin.TopLeft && s != t.FillOrigin.BottomRight) || (r = 1 - r), 
        a = ((n = e * Math.tan(Math.PI / 2 * r)) - i) / n, s) {
          case t.FillOrigin.TopLeft:
            o = h ? n <= i ? [ 0, 0, e, n, e, 0 ] : [ 0, 0, e * (1 - a), i, e, i, e, 0 ] : n <= i ? [ 0, 0, e, n, e, i, 0, i ] : [ 0, 0, e * (1 - a), i, 0, i ];
            break;

          case t.FillOrigin.TopRight:
            o = h ? n <= i ? [ e, 0, 0, n, 0, i, e, i ] : [ e, 0, e * a, i, e, i ] : n <= i ? [ e, 0, 0, n, 0, 0 ] : [ e, 0, e * a, i, 0, i, 0, 0 ];
            break;

          case t.FillOrigin.BottomLeft:
            o = h ? n <= i ? [ 0, i, e, i - n, e, 0, 0, 0 ] : [ 0, i, e * (1 - a), 0, 0, 0 ] : n <= i ? [ 0, i, e, i - n, e, i ] : [ 0, i, e * (1 - a), 0, e, 0, e, i ];
            break;

          case t.FillOrigin.BottomRight:
            o = h ? n <= i ? [ e, i, 0, i - n, 0, i ] : [ e, i, e * a, 0, 0, 0, 0, i ] : n <= i ? [ e, i, 0, i - n, 0, 0, e, 0 ] : [ e, i, e * a, 0, e, 0 ];
        }
        return o;
    }
    function movePoints(t, e, i) {
        for (var s = t.length, h = 0; h < s; h += 2) t[h] += e, t[h + 1] += i;
    }
    function fillRadial180(e, i, s, h, r) {
        var a;
        switch (s) {
          case t.FillOrigin.Top:
            r <= .5 ? (r /= .5, a = fillRadial90(e / 2, i, h ? t.FillOrigin.TopLeft : t.FillOrigin.TopRight, h, r), 
            h && movePoints(a, e / 2, 0)) : (r = (r - .5) / .5, a = fillRadial90(e / 2, i, h ? t.FillOrigin.TopRight : t.FillOrigin.TopLeft, h, r), 
            h ? a.push(e, i, e, 0) : (movePoints(a, e / 2, 0), a.push(0, i, 0, 0)));
            break;

          case t.FillOrigin.Bottom:
            r <= .5 ? (r /= .5, a = fillRadial90(e / 2, i, h ? t.FillOrigin.BottomRight : t.FillOrigin.BottomLeft, h, r), 
            h || movePoints(a, e / 2, 0)) : (r = (r - .5) / .5, a = fillRadial90(e / 2, i, h ? t.FillOrigin.BottomLeft : t.FillOrigin.BottomRight, h, r), 
            h ? (movePoints(a, e / 2, 0), a.push(0, 0, 0, i)) : a.push(e, 0, e, i));
            break;

          case t.FillOrigin.Left:
            r <= .5 ? (r /= .5, a = fillRadial90(e, i / 2, h ? t.FillOrigin.BottomLeft : t.FillOrigin.TopLeft, h, r), 
            h || movePoints(a, 0, i / 2)) : (r = (r - .5) / .5, a = fillRadial90(e, i / 2, h ? t.FillOrigin.TopLeft : t.FillOrigin.BottomLeft, h, r), 
            h ? (movePoints(a, 0, i / 2), a.push(e, 0, 0, 0)) : a.push(e, i, 0, i));
            break;

          case t.FillOrigin.Right:
            r <= .5 ? (r /= .5, a = fillRadial90(e, i / 2, h ? t.FillOrigin.TopRight : t.FillOrigin.BottomRight, h, r), 
            h && movePoints(a, 0, i / 2)) : (r = (r - .5) / .5, a = fillRadial90(e, i / 2, h ? t.FillOrigin.BottomRight : t.FillOrigin.TopRight, h, r), 
            h ? a.push(0, i, e, i) : (movePoints(a, 0, i / 2), a.push(0, 0, e, 0)));
        }
        return a;
    }
    t.fillImage = function(e, i, s, h, r, a) {
        if (a <= 0) return null;
        if (a >= .9999) return [ 0, 0, e, 0, e, i, 0, i ];
        var n;
        switch (s) {
          case t.FillMethod.Horizontal:
            n = function(e, i, s, h) {
                var r = e * h;
                return s == t.FillOrigin.Left || s == t.FillOrigin.Top ? [ 0, 0, r, 0, r, i, 0, i ] : [ e, 0, e, i, e - r, i, e - r, 0 ];
            }(e, i, h, a);
            break;

          case t.FillMethod.Vertical:
            n = function(e, i, s, h) {
                var r = i * h;
                return s == t.FillOrigin.Left || s == t.FillOrigin.Top ? [ 0, 0, 0, r, e, r, e, 0 ] : [ 0, i, e, i, e, i - r, 0, i - r ];
            }(e, i, h, a);
            break;

          case t.FillMethod.Radial90:
            n = fillRadial90(e, i, h, r, a);
            break;

          case t.FillMethod.Radial180:
            n = fillRadial180(e, i, h, r, a);
            break;

          case t.FillMethod.Radial360:
            n = function(e, i, s, h, r) {
                var a;
                switch (s) {
                  case t.FillOrigin.Top:
                    r <= .5 ? (r /= .5, a = fillRadial180(e / 2, i, h ? t.FillOrigin.Left : t.FillOrigin.Right, h, r), 
                    h && movePoints(a, e / 2, 0)) : (r = (r - .5) / .5, a = fillRadial180(e / 2, i, h ? t.FillOrigin.Right : t.FillOrigin.Left, h, r), 
                    h ? a.push(e, i, e, 0, e / 2, 0) : (movePoints(a, e / 2, 0), a.push(0, i, 0, 0, e / 2, 0)));
                    break;

                  case t.FillOrigin.Bottom:
                    r <= .5 ? (r /= .5, a = fillRadial180(e / 2, i, h ? t.FillOrigin.Right : t.FillOrigin.Left, h, r), 
                    h || movePoints(a, e / 2, 0)) : (r = (r - .5) / .5, a = fillRadial180(e / 2, i, h ? t.FillOrigin.Left : t.FillOrigin.Right, h, r), 
                    h ? (movePoints(a, e / 2, 0), a.push(0, 0, 0, i, e / 2, i)) : a.push(e, 0, e, i, e / 2, i));
                    break;

                  case t.FillOrigin.Left:
                    r <= .5 ? (r /= .5, a = fillRadial180(e, i / 2, h ? t.FillOrigin.Bottom : t.FillOrigin.Top, h, r), 
                    h || movePoints(a, 0, i / 2)) : (r = (r - .5) / .5, a = fillRadial180(e, i / 2, h ? t.FillOrigin.Top : t.FillOrigin.Bottom, h, r), 
                    h ? (movePoints(a, 0, i / 2), a.push(e, 0, 0, 0, 0, i / 2)) : a.push(e, i, 0, i, 0, i / 2));
                    break;

                  case t.FillOrigin.Right:
                    r <= .5 ? (r /= .5, a = fillRadial180(e, i / 2, h ? t.FillOrigin.Top : t.FillOrigin.Bottom, h, r), 
                    h && movePoints(a, 0, i / 2)) : (r = (r - .5) / .5, a = fillRadial180(e, i / 2, h ? t.FillOrigin.Bottom : t.FillOrigin.Top, h, r), 
                    h ? a.push(0, i, e, i, e, i / 2) : (movePoints(a, 0, i / 2), a.push(0, 0, e, 0, e, i / 2)));
                }
                return a;
            }(e, i, h, r, a);
        }
        return n;
    };
}(fgui), function(t) {
    t.Image = class extends Laya.Sprite {
        constructor() {
            super(), this._tileGridIndice = 0, this._needRebuild = 0, this._fillMethod = 0, 
            this._fillOrigin = 0, this._fillAmount = 0, this.mouseEnabled = !1, this._color = "#FFFFFF";
        }
        set width(t) {
            this._width !== t && (super.set_width(t), this.markChanged(1));
        }
        set height(t) {
            this._height !== t && (super.set_height(t), this.markChanged(1));
        }
        get texture() {
            return this._source;
        }
        set texture(t) {
            this._source != t && (this._source = t, 0 == this._width && (this._source ? this.size(this._source.width, this._source.height) : this.size(0, 0)), 
            this.repaint(), this.markChanged(1));
        }
        get scale9Grid() {
            return this._scale9Grid;
        }
        set scale9Grid(t) {
            this._scale9Grid = t, this._sizeGrid = null, this.markChanged(1);
        }
        get scaleByTile() {
            return this._scaleByTile;
        }
        set scaleByTile(t) {
            this._scaleByTile != t && (this._scaleByTile = t, this.markChanged(1));
        }
        get tileGridIndice() {
            return this._tileGridIndice;
        }
        set tileGridIndice(t) {
            this._tileGridIndice != t && (this._tileGridIndice = t, this.markChanged(1));
        }
        get fillMethod() {
            return this._fillMethod;
        }
        set fillMethod(t) {
            this._fillMethod != t && (this._fillMethod = t, 0 != this._fillMethod ? (this._mask || (this._mask = new Laya.Sprite(), 
            this._mask.mouseEnabled = !1), this.mask = this._mask, this.markChanged(2)) : this.mask && (this._mask.graphics.clear(), 
            this.mask = null));
        }
        get fillOrigin() {
            return this._fillOrigin;
        }
        set fillOrigin(t) {
            this._fillOrigin != t && (this._fillOrigin = t, 0 != this._fillMethod && this.markChanged(2));
        }
        get fillClockwise() {
            return this._fillClockwise;
        }
        set fillClockwise(t) {
            this._fillClockwise != t && (this._fillClockwise = t, 0 != this._fillMethod && this.markChanged(2));
        }
        get fillAmount() {
            return this._fillAmount;
        }
        set fillAmount(t) {
            this._fillAmount != t && (this._fillAmount = t, 0 != this._fillMethod && this.markChanged(2));
        }
        get color() {
            return this._color;
        }
        set color(e) {
            this._color != e && (this._color = e, t.ToolSet.setColorFilter(this, e));
        }
        markChanged(t) {
            this._needRebuild ? this._needRebuild |= t : (this._needRebuild = t, Laya.timer.callLater(this, this.rebuild));
        }
        rebuild() {
            0 != (1 & this._needRebuild) && this.doDraw(), 0 != (2 & this._needRebuild) && 0 != this._fillMethod && this.doFill(), 
            this._needRebuild = 0;
        }
        doDraw() {
            var t = this._width, e = this._height, i = this.graphics, s = this._source;
            if (i.clear(), null != s && 0 != t && 0 != e) if (this._scaleByTile) i.fillTexture(s, 0, 0, t, e); else if (this._scale9Grid) {
                if (!this._sizeGrid) {
                    var h = s.width, r = s.height, a = this._scale9Grid.x, n = Math.max(h - this._scale9Grid.right, 0), o = this._scale9Grid.y, l = Math.max(r - this._scale9Grid.bottom, 0);
                    this._sizeGrid = [ o, n, l, a, this._tileGridIndice ];
                }
                i.draw9Grid(s, 0, 0, t, e, this._sizeGrid);
            } else i.drawImage(s, 0, 0, t, e);
        }
        doFill() {
            var e = this._width, i = this._height, s = this._mask.graphics;
            if (s.clear(), 0 != e && 0 != i) {
                var h = t.fillImage(e, i, this._fillMethod, this._fillOrigin, this._fillClockwise, this._fillAmount);
                if (null == h) return this.mask = null, void (this.mask = this._mask);
                s.drawPoly(0, 0, h, "#FFFFFF");
            }
        }
    };
}(fgui), function(t) {
    t.MovieClip = class extends t.Image {
        constructor() {
            super(), this.interval = 0, this.repeatDelay = 0, this.timeScale = 1, this._playing = !0, 
            this._frameCount = 0, this._frame = 0, this._start = 0, this._end = 0, this._times = 0, 
            this._endAt = 0, this._status = 0, this._frameElapsed = 0, this._repeatedCount = 0, 
            this.mouseEnabled = !1, this.setPlaySettings(), this.on(Laya.Event.DISPLAY, this, this.__addToStage), 
            this.on(Laya.Event.UNDISPLAY, this, this.__removeFromStage);
        }
        get frames() {
            return this._frames;
        }
        set frames(t) {
            this._frames = t, this._scaleByTile = !1, this._scale9Grid = null, this._frames ? (this._frameCount = this._frames.length, 
            (-1 == this._end || this._end > this._frameCount - 1) && (this._end = this._frameCount - 1), 
            (-1 == this._endAt || this._endAt > this._frameCount - 1) && (this._endAt = this._frameCount - 1), 
            (this._frame < 0 || this._frame > this._frameCount - 1) && (this._frame = this._frameCount - 1), 
            this._frameElapsed = 0, this._repeatedCount = 0, this._reversed = !1) : this._frameCount = 0, 
            this.drawFrame(), this.checkTimer();
        }
        get frameCount() {
            return this._frameCount;
        }
        get frame() {
            return this._frame;
        }
        set frame(t) {
            this._frame != t && (this._frames && t >= this._frameCount && (t = this._frameCount - 1), 
            this._frame = t, this._frameElapsed = 0, this.drawFrame());
        }
        get playing() {
            return this._playing;
        }
        set playing(t) {
            this._playing != t && (this._playing = t, this.checkTimer());
        }
        rewind() {
            this._frame = 0, this._frameElapsed = 0, this._reversed = !1, this._repeatedCount = 0, 
            this.drawFrame();
        }
        syncStatus(t) {
            this._frame = t._frame, this._frameElapsed = t._frameElapsed, this._reversed = t._reversed, 
            this._repeatedCount = t._repeatedCount, this.drawFrame();
        }
        advance(t) {
            for (var e = this._frame, i = this._reversed, s = t; ;) {
                var h = this.interval + this._frames[this._frame].addDelay;
                if (0 == this._frame && this._repeatedCount > 0 && (h += this.repeatDelay), t < h) {
                    this._frameElapsed = 0;
                    break;
                }
                if (t -= h, this.swing ? this._reversed ? (this._frame--, this._frame <= 0 && (this._frame = 0, 
                this._repeatedCount++, this._reversed = !this._reversed)) : (this._frame++, this._frame > this._frameCount - 1 && (this._frame = Math.max(0, this._frameCount - 2), 
                this._repeatedCount++, this._reversed = !this._reversed)) : (this._frame++, this._frame > this._frameCount - 1 && (this._frame = 0, 
                this._repeatedCount++)), this._frame == e && this._reversed == i) {
                    var r = s - t;
                    t -= Math.floor(t / r) * r;
                }
            }
            this.drawFrame();
        }
        setPlaySettings(t, e, i, s, h) {
            null == t && (t = 0), null == e && (e = -1), null == i && (i = 0), null == s && (s = -1), 
            this._start = t, this._end = e, (-1 == this._end || this._end > this._frameCount - 1) && (this._end = this._frameCount - 1), 
            this._times = i, this._endAt = s, -1 == this._endAt && (this._endAt = this._end), 
            this._status = 0, this._endHandler = h, this.frame = t;
        }
        update() {
            if (this._playing && 0 != this._frameCount && 3 != this._status) {
                var t = Laya.timer.delta;
                t > 100 && (t = 100), 1 != this.timeScale && (t *= this.timeScale), this._frameElapsed += t;
                var e = this.interval + this._frames[this._frame].addDelay;
                if (0 == this._frame && this._repeatedCount > 0 && (e += this.repeatDelay), !(this._frameElapsed < e)) {
                    if (this._frameElapsed -= e, this._frameElapsed > this.interval && (this._frameElapsed = this.interval), 
                    this.swing ? this._reversed ? (this._frame--, this._frame <= 0 && (this._frame = 0, 
                    this._repeatedCount++, this._reversed = !this._reversed)) : (this._frame++, this._frame > this._frameCount - 1 && (this._frame = Math.max(0, this._frameCount - 2), 
                    this._repeatedCount++, this._reversed = !this._reversed)) : (this._frame++, this._frame > this._frameCount - 1 && (this._frame = 0, 
                    this._repeatedCount++)), 1 == this._status) this._frame = this._start, this._frameElapsed = 0, 
                    this._status = 0; else if (2 == this._status) {
                        if (this._frame = this._endAt, this._frameElapsed = 0, this._status = 3, this._endHandler) {
                            var i = this._endHandler;
                            this._endHandler = null, i.run();
                        }
                    } else this._frame == this._end && (this._times > 0 ? (this._times--, 0 == this._times ? this._status = 2 : this._status = 1) : this._status = 1);
                    this.drawFrame();
                }
            }
        }
        drawFrame() {
            if (this._frameCount > 0 && this._frame < this._frames.length) {
                var t = this._frames[this._frame];
                this.texture = t.texture;
            } else this.texture = null;
            this.rebuild();
        }
        checkTimer() {
            this._playing && this._frameCount > 0 && null != this.stage ? Laya.timer.frameLoop(1, this, this.update) : Laya.timer.clear(this, this.update);
        }
        __addToStage() {
            this._playing && this._frameCount > 0 && Laya.timer.frameLoop(1, this, this.update);
        }
        __removeFromStage() {
            Laya.timer.clear(this, this.update);
        }
    };
}(fgui), function(t) {
    var e;
    t.GearBase = class {
        constructor(t) {
            this._owner = t;
        }
        static create(i, s) {
            return e || (e = [ t.GearDisplay, t.GearXY, t.GearSize, t.GearLook, t.GearColor, t.GearAnimation, t.GearText, t.GearIcon, t.GearDisplay2, t.GearFontSize ]), 
            new e[s](i);
        }
        dispose() {
            this._tweenConfig && this._tweenConfig._tweener && (this._tweenConfig._tweener.kill(), 
            this._tweenConfig._tweener = null);
        }
        get controller() {
            return this._controller;
        }
        set controller(t) {
            t != this._controller && (this._controller = t, this._controller && this.init());
        }
        get tweenConfig() {
            return this._tweenConfig || (this._tweenConfig = new i()), this._tweenConfig;
        }
        setup(e) {
            var s, h;
            this._controller = this._owner.parent.getControllerAt(e.getInt16()), this.init();
            var r = e.getInt16();
            if (this instanceof t.GearDisplay) this.pages = e.readSArray(r); else if (this instanceof t.GearDisplay2) this.pages = e.readSArray(r); else {
                for (s = 0; s < r; s++) null != (h = e.readS()) && this.addStatus(h, e);
                e.readBool() && this.addStatus(null, e);
            }
            if (e.readBool() && (this._tweenConfig = new i(), this._tweenConfig.easeType = e.readByte(), 
            this._tweenConfig.duration = e.getFloat32(), this._tweenConfig.delay = e.getFloat32()), 
            e.version >= 2) if (this instanceof t.GearXY) {
                if (e.readBool()) {
                    for (this.positionsInPercent = !0, s = 0; s < r; s++) null != (h = e.readS()) && this.addExtStatus(h, e);
                    e.readBool() && this.addExtStatus(null, e);
                }
            } else this instanceof t.GearDisplay2 && (this.condition = e.readByte());
        }
        updateFromRelations(t, e) {}
        addStatus(t, e) {}
        init() {}
        apply() {}
        updateState() {}
    };
    class i {
        constructor() {
            this.tween = !0, this.easeType = t.EaseType.QuadOut, this.duration = .3, this.delay = 0;
        }
    }
    t.GearTweenConfig = i;
}(fgui), function(t) {
    t.GearAnimation = class extends t.GearBase {
        constructor(t) {
            super(t);
        }
        init() {
            this._default = {
                playing: this._owner.getProp(t.ObjectPropID.Playing),
                frame: this._owner.getProp(t.ObjectPropID.Frame)
            }, this._storage = {};
        }
        addStatus(t, e) {
            var i;
            null == t ? i = this._default : this._storage[t] = i = {}, i.playing = e.readBool(), 
            i.frame = e.getInt32();
        }
        apply() {
            this._owner._gearLocked = !0;
            var e = this._storage[this._controller.selectedPageId];
            e || (e = this._default), this._owner.setProp(t.ObjectPropID.Playing, e.playing), 
            this._owner.setProp(t.ObjectPropID.Frame, e.frame), this._owner._gearLocked = !1;
        }
        updateState() {
            var e = this._storage[this._controller.selectedPageId];
            e || (this._storage[this._controller.selectedPageId] = e = {}), e.playing = this._owner.getProp(t.ObjectPropID.Playing), 
            e.frame = this._owner.getProp(t.ObjectPropID.Frame);
        }
    };
}(fgui), function(t) {
    t.GearColor = class extends t.GearBase {
        constructor(t) {
            super(t);
        }
        init() {
            this._default = {
                color: this._owner.getProp(t.ObjectPropID.Color),
                strokeColor: this._owner.getProp(t.ObjectPropID.OutlineColor)
            }, this._storage = {};
        }
        addStatus(t, e) {
            var i;
            null == t ? i = this._default : this._storage[t] = i = {}, i.color = e.readColorS(), 
            i.strokeColor = e.readColorS();
        }
        apply() {
            this._owner._gearLocked = !0;
            var e = this._storage[this._controller.selectedPageId];
            e || (e = this._default), this._owner.setProp(t.ObjectPropID.Color, e.color), this._owner.setProp(t.ObjectPropID.OutlineColor, e.strokeColor), 
            this._owner._gearLocked = !1;
        }
        updateState() {
            var e = this._storage[this._controller.selectedPageId];
            e || (this._storage[this._controller.selectedPageId] = e = {}), e.color = this._owner.getProp(t.ObjectPropID.Color), 
            e.strokeColor = this._owner.getProp(t.ObjectPropID.OutlineColor);
        }
    };
}(fgui), function(t) {
    t.GearDisplay = class extends t.GearBase {
        constructor(t) {
            super(t), this._displayLockToken = 1, this._visible = 0;
        }
        init() {
            this.pages = null;
        }
        apply() {
            this._displayLockToken++, 0 == this._displayLockToken && (this._displayLockToken = 1), 
            null == this.pages || 0 == this.pages.length || -1 != this.pages.indexOf(this._controller.selectedPageId) ? this._visible = 1 : this._visible = 0;
        }
        addLock() {
            return this._visible++, this._displayLockToken;
        }
        releaseLock(t) {
            t == this._displayLockToken && this._visible--;
        }
        get connected() {
            return null == this._controller || this._visible > 0;
        }
    };
}(fgui), function(t) {
    t.GearDisplay2 = class extends t.GearBase {
        constructor(t) {
            super(t), this._visible = 0;
        }
        init() {
            this.pages = null;
        }
        apply() {
            null == this.pages || 0 == this.pages.length || -1 != this.pages.indexOf(this._controller.selectedPageId) ? this._visible = 1 : this._visible = 0;
        }
        evaluate(t) {
            var e = null == this._controller || this._visible > 0;
            return e = 0 == this.condition ? e && t : e || t;
        }
    };
}(fgui), function(t) {
    t.GearFontSize = class extends t.GearBase {
        constructor(t) {
            super(t), this._default = 0;
        }
        init() {
            this._default = this._owner.getProp(t.ObjectPropID.FontSize), this._storage = {};
        }
        addStatus(t, e) {
            null == t ? this._default = e.getInt32() : this._storage[t] = e.getInt32();
        }
        apply() {
            this._owner._gearLocked = !0;
            var e = this._storage[this._controller.selectedPageId];
            null != e ? this._owner.setProp(t.ObjectPropID.FontSize, e) : this._owner.setProp(t.ObjectPropID.FontSize, this._default), 
            this._owner._gearLocked = !1;
        }
        updateState() {
            this._storage[this._controller.selectedPageId] = this._owner.getProp(t.ObjectPropID.FontSize);
        }
    };
}(fgui), function(t) {
    t.GearIcon = class extends t.GearBase {
        constructor(t) {
            super(t);
        }
        init() {
            this._default = this._owner.icon, this._storage = {};
        }
        addStatus(t, e) {
            null == t ? this._default = e.readS() : this._storage[t] = e.readS();
        }
        apply() {
            this._owner._gearLocked = !0;
            var t = this._storage[this._controller.selectedPageId];
            this._owner.icon = void 0 !== t ? t : this._default, this._owner._gearLocked = !1;
        }
        updateState() {
            this._storage[this._controller.selectedPageId] = this._owner.icon;
        }
    };
}(fgui), function(t) {
    t.GearLook = class extends t.GearBase {
        constructor(t) {
            super(t);
        }
        init() {
            this._default = {
                alpha: this._owner.alpha,
                rotation: this._owner.rotation,
                grayed: this._owner.grayed,
                touchable: this._owner.touchable
            }, this._storage = {};
        }
        addStatus(t, e) {
            var i;
            null == t ? i = this._default : this._storage[t] = i = {}, i.alpha = e.getFloat32(), 
            i.rotation = e.getFloat32(), i.grayed = e.readBool(), i.touchable = e.readBool();
        }
        apply() {
            var e = this._storage[this._controller.selectedPageId];
            if (e || (e = this._default), this._tweenConfig && this._tweenConfig.tween && !t.UIPackage._constructing && !t.GearBase.disableAllTweenEffect) {
                if (this._owner._gearLocked = !0, this._owner.grayed = e.grayed, this._owner.touchable = e.touchable, 
                this._owner._gearLocked = !1, this._tweenConfig._tweener) {
                    if (this._tweenConfig._tweener.endValue.x == e.alpha && this._tweenConfig._tweener.endValue.y == e.rotation) return;
                    this._tweenConfig._tweener.kill(!0), this._tweenConfig._tweener = null;
                }
                var i = e.alpha != this._owner.alpha, s = e.rotation != this._owner.rotation;
                (i || s) && (this._owner.checkGearController(0, this._controller) && (this._tweenConfig._displayLockToken = this._owner.addDisplayLock()), 
                this._tweenConfig._tweener = t.GTween.to2(this._owner.alpha, this._owner.rotation, e.alpha, e.rotation, this._tweenConfig.duration).setDelay(this._tweenConfig.delay).setEase(this._tweenConfig.easeType).setUserData((i ? 1 : 0) + (s ? 2 : 0)).setTarget(this).onUpdate(this.__tweenUpdate, this).onComplete(this.__tweenComplete, this));
            } else this._owner._gearLocked = !0, this._owner.grayed = e.grayed, this._owner.touchable = e.touchable, 
            this._owner.alpha = e.alpha, this._owner.rotation = e.rotation, this._owner._gearLocked = !1;
        }
        __tweenUpdate(t) {
            var e = t.userData;
            this._owner._gearLocked = !0, 0 != (1 & e) && (this._owner.alpha = t.value.x), 0 != (2 & e) && (this._owner.rotation = t.value.y), 
            this._owner._gearLocked = !1;
        }
        __tweenComplete() {
            0 != this._tweenConfig._displayLockToken && (this._owner.releaseDisplayLock(this._tweenConfig._displayLockToken), 
            this._tweenConfig._displayLockToken = 0), this._tweenConfig._tweener = null;
        }
        updateState() {
            var t = this._storage[this._controller.selectedPageId];
            t || (this._storage[this._controller.selectedPageId] = t = {}), t.alpha = this._owner.alpha, 
            t.rotation = this._owner.rotation, t.grayed = this._owner.grayed, t.touchable = this._owner.touchable;
        }
    };
}(fgui), function(t) {
    t.GearSize = class extends t.GearBase {
        constructor(t) {
            super(t);
        }
        init() {
            this._default = {
                width: this._owner.width,
                height: this._owner.height,
                scaleX: this._owner.scaleX,
                scaleY: this._owner.scaleY
            }, this._storage = {};
        }
        addStatus(t, e) {
            var i;
            null == t ? i = this._default : this._storage[t] = i = {}, i.width = e.getInt32(), 
            i.height = e.getInt32(), i.scaleX = e.getFloat32(), i.scaleY = e.getFloat32();
        }
        apply() {
            var e = this._storage[this._controller.selectedPageId];
            if (e || (e = this._default), this._tweenConfig && this._tweenConfig.tween && !t.UIPackage._constructing && !t.GearBase.disableAllTweenEffect) {
                if (this._tweenConfig._tweener) {
                    if (this._tweenConfig._tweener.endValue.x == e.width && this._tweenConfig._tweener.endValue.y == e.height && this._tweenConfig._tweener.endValue.z == e.scaleX && this._tweenConfig._tweener.endValue.w == e.scaleY) return;
                    this._tweenConfig._tweener.kill(!0), this._tweenConfig._tweener = null;
                }
                var i = e.width != this._owner.width || e.height != this._owner.height, s = e.scaleX != this._owner.scaleX || e.scaleY != this._owner.scaleY;
                (i || s) && (this._owner.checkGearController(0, this._controller) && (this._tweenConfig._displayLockToken = this._owner.addDisplayLock()), 
                this._tweenConfig._tweener = t.GTween.to4(this._owner.width, this._owner.height, this._owner.scaleX, this._owner.scaleY, e.width, e.height, e.scaleX, e.scaleY, this._tweenConfig.duration).setDelay(this._tweenConfig.delay).setEase(this._tweenConfig.easeType).setUserData((i ? 1 : 0) + (s ? 2 : 0)).setTarget(this).onUpdate(this.__tweenUpdate, this).onComplete(this.__tweenComplete, this));
            } else this._owner._gearLocked = !0, this._owner.setSize(e.width, e.height, this._owner.getGear(1).controller == this._controller), 
            this._owner.setScale(e.scaleX, e.scaleY), this._owner._gearLocked = !1;
        }
        __tweenUpdate(t) {
            var e = t.userData;
            this._owner._gearLocked = !0, 0 != (1 & e) && this._owner.setSize(t.value.x, t.value.y, this._owner.checkGearController(1, this._controller)), 
            0 != (2 & e) && this._owner.setScale(t.value.z, t.value.w), this._owner._gearLocked = !1;
        }
        __tweenComplete() {
            0 != this._tweenConfig._displayLockToken && (this._owner.releaseDisplayLock(this._tweenConfig._displayLockToken), 
            this._tweenConfig._displayLockToken = 0), this._tweenConfig._tweener = null;
        }
        updateState() {
            var t = this._storage[this._controller.selectedPageId];
            t || (this._storage[this._controller.selectedPageId] = t = {}), t.width = this._owner.width, 
            t.height = this._owner.height, t.scaleX = this._owner.scaleX, t.scaleY = this._owner.scaleY;
        }
        updateFromRelations(t, e) {
            if (null != this._controller && null != this._storage) {
                for (var i in this._storage) {
                    var s = this._storage[i];
                    s.width += t, s.height += e;
                }
                this._default.width += t, this._default.height += e, this.updateState();
            }
        }
    };
}(fgui), function(t) {
    t.GearText = class extends t.GearBase {
        constructor(t) {
            super(t);
        }
        init() {
            this._default = this._owner.text, this._storage = {};
        }
        addStatus(t, e) {
            null == t ? this._default = e.readS() : this._storage[t] = e.readS();
        }
        apply() {
            this._owner._gearLocked = !0;
            var t = this._storage[this._controller.selectedPageId];
            this._owner.text = void 0 !== t ? t : this._default, this._owner._gearLocked = !1;
        }
        updateState() {
            this._storage[this._controller.selectedPageId] = this._owner.text;
        }
    };
}(fgui), function(t) {
    t.GearXY = class extends t.GearBase {
        constructor(t) {
            super(t);
        }
        init() {
            this._default = {
                x: this._owner.x,
                y: this._owner.y,
                px: this._owner.x / this._owner.parent.width,
                py: this._owner.y / this._owner.parent.height
            }, this._storage = {};
        }
        addStatus(t, e) {
            var i;
            null == t ? i = this._default : this._storage[t] = i = {}, i.x = e.getInt32(), i.y = e.getInt32();
        }
        addExtStatus(t, e) {
            var i;
            (i = null == t ? this._default : this._storage[t]).px = e.getFloat32(), i.py = e.getFloat32();
        }
        apply() {
            var e, i, s = this._storage[this._controller.selectedPageId];
            if (s || (s = this._default), this.positionsInPercent && this._owner.parent ? (e = s.px * this._owner.parent.width, 
            i = s.py * this._owner.parent.height) : (e = s.x, i = s.y), this._tweenConfig && this._tweenConfig.tween && !t.UIPackage._constructing && !t.GearBase.disableAllTweenEffect) {
                if (this._tweenConfig._tweener) {
                    if (this._tweenConfig._tweener.endValue.x == e && this._tweenConfig._tweener.endValue.y == i) return;
                    this._tweenConfig._tweener.kill(!0), this._tweenConfig._tweener = null;
                }
                var h = this._owner.x, r = this._owner.y;
                h == e && r == i || (this._owner.checkGearController(0, this._controller) && (this._tweenConfig._displayLockToken = this._owner.addDisplayLock()), 
                this._tweenConfig._tweener = t.GTween.to2(h, r, e, i, this._tweenConfig.duration).setDelay(this._tweenConfig.delay).setEase(this._tweenConfig.easeType).setTarget(this).onUpdate(this.__tweenUpdate, this).onComplete(this.__tweenComplete, this));
            } else this._owner._gearLocked = !0, this._owner.setXY(e, i), this._owner._gearLocked = !1;
        }
        __tweenUpdate(t) {
            this._owner._gearLocked = !0, this._owner.setXY(t.value.x, t.value.y), this._owner._gearLocked = !1;
        }
        __tweenComplete() {
            0 != this._tweenConfig._displayLockToken && (this._owner.releaseDisplayLock(this._tweenConfig._displayLockToken), 
            this._tweenConfig._displayLockToken = 0), this._tweenConfig._tweener = null;
        }
        updateState() {
            var t = this._storage[this._controller.selectedPageId];
            t || (this._storage[this._controller.selectedPageId] = t = {}), t.x = this._owner.x, 
            t.y = this._owner.y, t.px = this._owner.x / this._owner.parent.width, t.py = this._owner.y / this._owner.parent.height;
        }
        updateFromRelations(t, e) {
            if (null != this._controller && null != this._storage && !this.positionsInPercent) {
                for (var i in this._storage) {
                    var s = this._storage[i];
                    s.x += t, s.y += e;
                }
                this._default.x += t, this._default.y += e, this.updateState();
            }
        }
    };
}(fgui), function(t) {
    const e = .5 * Math.PI, i = 2 * Math.PI;
    function bounce_easeIn(t, e) {
        return 1 - bounce_easeOut(e - t, e);
    }
    function bounce_easeOut(t, e) {
        return (t /= e) < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
    }
    t.evaluateEase = function(s, h, r, a, n) {
        switch (s) {
          case t.EaseType.Linear:
            return h / r;

          case t.EaseType.SineIn:
            return 1 - Math.cos(h / r * e);

          case t.EaseType.SineOut:
            return Math.sin(h / r * e);

          case t.EaseType.SineInOut:
            return -.5 * (Math.cos(Math.PI * h / r) - 1);

          case t.EaseType.QuadIn:
            return (h /= r) * h;

          case t.EaseType.QuadOut:
            return -(h /= r) * (h - 2);

          case t.EaseType.QuadInOut:
            return (h /= .5 * r) < 1 ? .5 * h * h : -.5 * (--h * (h - 2) - 1);

          case t.EaseType.CubicIn:
            return (h /= r) * h * h;

          case t.EaseType.CubicOut:
            return (h = h / r - 1) * h * h + 1;

          case t.EaseType.CubicInOut:
            return (h /= .5 * r) < 1 ? .5 * h * h * h : .5 * ((h -= 2) * h * h + 2);

          case t.EaseType.QuartIn:
            return (h /= r) * h * h * h;

          case t.EaseType.QuartOut:
            return -((h = h / r - 1) * h * h * h - 1);

          case t.EaseType.QuartInOut:
            return (h /= .5 * r) < 1 ? .5 * h * h * h * h : -.5 * ((h -= 2) * h * h * h - 2);

          case t.EaseType.QuintIn:
            return (h /= r) * h * h * h * h;

          case t.EaseType.QuintOut:
            return (h = h / r - 1) * h * h * h * h + 1;

          case t.EaseType.QuintInOut:
            return (h /= .5 * r) < 1 ? .5 * h * h * h * h * h : .5 * ((h -= 2) * h * h * h * h + 2);

          case t.EaseType.ExpoIn:
            return 0 == h ? 0 : Math.pow(2, 10 * (h / r - 1));

          case t.EaseType.ExpoOut:
            return h == r ? 1 : 1 - Math.pow(2, -10 * h / r);

          case t.EaseType.ExpoInOut:
            return 0 == h ? 0 : h == r ? 1 : (h /= .5 * r) < 1 ? .5 * Math.pow(2, 10 * (h - 1)) : .5 * (2 - Math.pow(2, -10 * --h));

          case t.EaseType.CircIn:
            return -(Math.sqrt(1 - (h /= r) * h) - 1);

          case t.EaseType.CircOut:
            return Math.sqrt(1 - (h = h / r - 1) * h);

          case t.EaseType.CircInOut:
            return (h /= .5 * r) < 1 ? -.5 * (Math.sqrt(1 - h * h) - 1) : .5 * (Math.sqrt(1 - (h -= 2) * h) + 1);

          case t.EaseType.ElasticIn:
            var o;
            return 0 == h ? 0 : 1 == (h /= r) ? 1 : (0 == n && (n = .3 * r), a < 1 ? (a = 1, 
            o = n / 4) : o = n / i * Math.asin(1 / a), -a * Math.pow(2, 10 * (h -= 1)) * Math.sin((h * r - o) * i / n));

          case t.EaseType.ElasticOut:
            var l;
            return 0 == h ? 0 : 1 == (h /= r) ? 1 : (0 == n && (n = .3 * r), a < 1 ? (a = 1, 
            l = n / 4) : l = n / i * Math.asin(1 / a), a * Math.pow(2, -10 * h) * Math.sin((h * r - l) * i / n) + 1);

          case t.EaseType.ElasticInOut:
            var _;
            return 0 == h ? 0 : 2 == (h /= .5 * r) ? 1 : (0 == n && (n = r * (.3 * 1.5)), a < 1 ? (a = 1, 
            _ = n / 4) : _ = n / i * Math.asin(1 / a), h < 1 ? a * Math.pow(2, 10 * (h -= 1)) * Math.sin((h * r - _) * i / n) * -.5 : a * Math.pow(2, -10 * (h -= 1)) * Math.sin((h * r - _) * i / n) * .5 + 1);

          case t.EaseType.BackIn:
            return (h /= r) * h * ((a + 1) * h - a);

          case t.EaseType.BackOut:
            return (h = h / r - 1) * h * ((a + 1) * h + a) + 1;

          case t.EaseType.BackInOut:
            return (h /= .5 * r) < 1 ? h * h * ((1 + (a *= 1.525)) * h - a) * .5 : .5 * ((h -= 2) * h * ((1 + (a *= 1.525)) * h + a) + 2);

          case t.EaseType.BounceIn:
            return bounce_easeIn(h, r);

          case t.EaseType.BounceOut:
            return bounce_easeOut(h, r);

          case t.EaseType.BounceInOut:
            return function(t, e) {
                return t < .5 * e ? .5 * bounce_easeIn(2 * t, e) : .5 * bounce_easeOut(2 * t - e, e) + .5;
            }(h, r);

          default:
            return -(h /= r) * (h - 2);
        }
    };
}(fgui), function(t) {
    class e {}
    e.Linear = 0, e.SineIn = 1, e.SineOut = 2, e.SineInOut = 3, e.QuadIn = 4, e.QuadOut = 5, 
    e.QuadInOut = 6, e.CubicIn = 7, e.CubicOut = 8, e.CubicInOut = 9, e.QuartIn = 10, 
    e.QuartOut = 11, e.QuartInOut = 12, e.QuintIn = 13, e.QuintOut = 14, e.QuintInOut = 15, 
    e.ExpoIn = 16, e.ExpoOut = 17, e.ExpoInOut = 18, e.CircIn = 19, e.CircOut = 20, 
    e.CircInOut = 21, e.ElasticIn = 22, e.ElasticOut = 23, e.ElasticInOut = 24, e.BackIn = 25, 
    e.BackOut = 26, e.BackInOut = 27, e.BounceIn = 28, e.BounceOut = 29, e.BounceInOut = 30, 
    e.Custom = 31, t.EaseType = e;
}(fgui), function(t) {
    t.GPath = class {
        constructor() {
            this._segments = new Array(), this._points = new Array();
        }
        get length() {
            return this._fullLength;
        }
        create(i, s, h, r) {
            var a;
            Array.isArray(i) ? a = i : ((a = new Array()).push(i), a.push(s), h && a.push(h), 
            r && a.push(r)), this._segments.length = 0, this._points.length = 0, this._fullLength = 0;
            var n = a.length;
            if (0 != n) {
                var o = e;
                o.length = 0;
                var l = a[0];
                l.curveType == t.CurveType.CRSpline && o.push(new Laya.Point(l.x, l.y));
                for (var _ = 1; _ < n; _++) {
                    var d = a[_];
                    if (l.curveType != t.CurveType.CRSpline) {
                        var c = {};
                        c.type = l.curveType, c.ptStart = this._points.length, l.curveType == t.CurveType.Straight ? (c.ptCount = 2, 
                        this._points.push(new Laya.Point(l.x, l.y)), this._points.push(new Laya.Point(d.x, d.y))) : l.curveType == t.CurveType.Bezier ? (c.ptCount = 3, 
                        this._points.push(new Laya.Point(l.x, l.y)), this._points.push(new Laya.Point(d.x, d.y)), 
                        this._points.push(new Laya.Point(l.control1_x, l.control1_y))) : l.curveType == t.CurveType.CubicBezier && (c.ptCount = 4, 
                        this._points.push(new Laya.Point(l.x, l.y)), this._points.push(new Laya.Point(d.x, d.y)), 
                        this._points.push(new Laya.Point(l.control1_x, l.control1_y)), this._points.push(new Laya.Point(l.control2_x, l.control2_y))), 
                        c.length = t.ToolSet.distance(l.x, l.y, d.x, d.y), this._fullLength += c.length, 
                        this._segments.push(c);
                    }
                    d.curveType != t.CurveType.CRSpline ? o.length > 0 && (o.push(new Laya.Point(d.x, d.y)), 
                    this.createSplineSegment()) : o.push(new Laya.Point(d.x, d.y)), l = d;
                }
                o.length > 1 && this.createSplineSegment();
            }
        }
        createSplineSegment() {
            var i = e, s = i.length;
            i.splice(0, 0, i[0]), i.push(i[s]), i.push(i[s]), s += 3;
            var h = {};
            h.type = t.CurveType.CRSpline, h.ptStart = this._points.length, h.ptCount = s, this._points = this._points.concat(i), 
            h.length = 0;
            for (var r = 1; r < s; r++) h.length += t.ToolSet.distance(i[r - 1].x, i[r - 1].y, i[r].x, i[r].y);
            this._fullLength += h.length, this._segments.push(h), i.length = 0;
        }
        clear() {
            this._segments.length = 0, this._points.length = 0;
        }
        getPointAt(e, i) {
            i ? i.x = i.y = 0 : i = new Laya.Point(), e = t.ToolSet.clamp01(e);
            var s, h = this._segments.length;
            if (0 == h) return i;
            if (1 == e) return (s = this._segments[h - 1]).type == t.CurveType.Straight ? (i.x = t.ToolSet.lerp(this._points[s.ptStart].x, this._points[s.ptStart + 1].x, e), 
            i.y = t.ToolSet.lerp(this._points[s.ptStart].y, this._points[s.ptStart + 1].y, e), 
            i) : s.type == t.CurveType.Bezier || s.type == t.CurveType.CubicBezier ? this.onBezierCurve(s.ptStart, s.ptCount, e, i) : this.onCRSplineCurve(s.ptStart, s.ptCount, e, i);
            for (var r = e * this._fullLength, a = 0; a < h; a++) if ((r -= (s = this._segments[a]).length) < 0) {
                e = 1 + r / s.length, s.type == t.CurveType.Straight ? (i.x = t.ToolSet.lerp(this._points[s.ptStart].x, this._points[s.ptStart + 1].x, e), 
                i.y = t.ToolSet.lerp(this._points[s.ptStart].y, this._points[s.ptStart + 1].y, e)) : i = s.type == t.CurveType.Bezier || s.type == t.CurveType.CubicBezier ? this.onBezierCurve(s.ptStart, s.ptCount, e, i) : this.onCRSplineCurve(s.ptStart, s.ptCount, e, i);
                break;
            }
            return i;
        }
        get segmentCount() {
            return this._segments.length;
        }
        getAnchorsInSegment(t, e) {
            null == e && (e = new Array());
            for (var i = this._segments[t], s = 0; s < i.ptCount; s++) e.push(new Laya.Point(this._points[i.ptStart + s].x, this._points[i.ptStart + s].y));
            return e;
        }
        getPointsInSegment(e, i, s, h, r, a) {
            null == h && (h = new Array()), a && !isNaN(a) || (a = .1), r && r.push(i);
            var n = this._segments[e];
            if (n.type == t.CurveType.Straight) h.push(new Laya.Point(t.ToolSet.lerp(this._points[n.ptStart].x, this._points[n.ptStart + 1].x, i), t.ToolSet.lerp(this._points[n.ptStart].y, this._points[n.ptStart + 1].y, i))), 
            h.push(new Laya.Point(t.ToolSet.lerp(this._points[n.ptStart].x, this._points[n.ptStart + 1].x, s), t.ToolSet.lerp(this._points[n.ptStart].y, this._points[n.ptStart + 1].y, s))); else {
                var o;
                o = n.type == t.CurveType.Bezier || n.type == t.CurveType.CubicBezier ? this.onBezierCurve : this.onCRSplineCurve, 
                h.push(o.call(this, n.ptStart, n.ptCount, i, new Laya.Point()));
                for (var l = Math.min(n.length * a, 50), _ = 0; _ <= l; _++) {
                    var d = _ / l;
                    d > i && d < s && (h.push(o.call(this, n.ptStart, n.ptCount, d, new Laya.Point())), 
                    r && r.push(d));
                }
                h.push(o.call(this, n.ptStart, n.ptCount, s, new Laya.Point()));
            }
            return r && r.push(s), h;
        }
        getAllPoints(t, e, i) {
            null == t && (t = new Array()), i && !isNaN(i) || (i = .1);
            for (var s = this._segments.length, h = 0; h < s; h++) this.getPointsInSegment(h, 0, 1, t, e, i);
            return t;
        }
        onCRSplineCurve(e, i, s, h) {
            var r = Math.floor(s * (i - 4)) + e, a = this._points[r].x, n = this._points[r].y, o = this._points[r + 1].x, l = this._points[r + 1].y, _ = this._points[r + 2].x, d = this._points[r + 2].y, c = this._points[r + 3].x, u = this._points[r + 3].y, g = 1 == s ? 1 : t.ToolSet.repeat(s * (i - 4), 1), p = ((2 - g) * g - 1) * g * .5, f = .5 * ((3 * g - 5) * g * g + 2), y = ((-3 * g + 4) * g + 1) * g * .5, m = (g - 1) * g * g * .5;
            return h.x = a * p + o * f + _ * y + c * m, h.y = n * p + l * f + d * y + u * m, 
            h;
        }
        onBezierCurve(t, e, i, s) {
            var h = 1 - i, r = this._points[t].x, a = this._points[t].y, n = this._points[t + 1].x, o = this._points[t + 1].y, l = this._points[t + 2].x, _ = this._points[t + 2].y;
            if (4 == e) {
                var d = this._points[t + 3].x, c = this._points[t + 3].y;
                s.x = h * h * h * r + 3 * h * h * i * l + 3 * h * i * i * d + i * i * i * n, s.y = h * h * h * a + 3 * h * h * i * _ + 3 * h * i * i * c + i * i * i * o;
            } else s.x = h * h * r + 2 * h * i * l + i * i * n, s.y = h * h * a + 2 * h * i * _ + i * i * o;
            return s;
        }
    };
    var e = new Array();
}(fgui), function(t) {
    let e;
    !function(t) {
        t[t.CRSpline = 0] = "CRSpline", t[t.Bezier = 1] = "Bezier", t[t.CubicBezier = 2] = "CubicBezier", 
        t[t.Straight = 3] = "Straight";
    }(e = t.CurveType || (t.CurveType = {}));
    class i {
        constructor() {
            this.x = 0, this.y = 0, this.control1_x = 0, this.control1_y = 0, this.control2_x = 0, 
            this.control2_y = 0, this.curveType = 0;
        }
        static newPoint(t = 0, e = 0, s = 0) {
            var h = new i();
            return h.x = t, h.y = e, h.control1_x = 0, h.control1_y = 0, h.control2_x = 0, h.control2_y = 0, 
            h.curveType = s, h;
        }
        static newBezierPoint(t = 0, s = 0, h = 0, r = 0) {
            var a = new i();
            return a.x = t, a.y = s, a.control1_x = h, a.control1_y = r, a.control2_x = 0, a.control2_y = 0, 
            a.curveType = e.Bezier, a;
        }
        static newCubicBezierPoint(t = 0, s = 0, h = 0, r = 0, a = 0, n = 0) {
            var o = new i();
            return o.x = t, o.y = s, o.control1_x = h, o.control1_y = r, o.control2_x = a, o.control2_y = n, 
            o.curveType = e.CubicBezier, o;
        }
        clone() {
            var t = new i();
            return t.x = this.x, t.y = this.y, t.control1_x = this.control1_x, t.control1_y = this.control1_y, 
            t.control2_x = this.control2_x, t.control2_y = this.control2_y, t.curveType = this.curveType, 
            t;
        }
    }
    t.GPathPoint = i;
}(fgui), function(t) {
    class e {
        static to(e, i, s) {
            return t.TweenManager.createTween()._to(e, i, s);
        }
        static to2(e, i, s, h, r) {
            return t.TweenManager.createTween()._to2(e, i, s, h, r);
        }
        static to3(e, i, s, h, r, a, n) {
            return t.TweenManager.createTween()._to3(e, i, s, h, r, a, n);
        }
        static to4(e, i, s, h, r, a, n, o, l) {
            return t.TweenManager.createTween()._to4(e, i, s, h, r, a, n, o, l);
        }
        static toColor(e, i, s) {
            return t.TweenManager.createTween()._toColor(e, i, s);
        }
        static delayedCall(e) {
            return t.TweenManager.createTween().setDelay(e);
        }
        static shake(e, i, s, h) {
            return t.TweenManager.createTween()._shake(e, i, s, h);
        }
        static isTweening(e, i) {
            return t.TweenManager.isTweening(e, i);
        }
        static kill(e, i, s) {
            t.TweenManager.killTweens(e, i, s);
        }
        static getTween(e, i) {
            return t.TweenManager.getTween(e, i);
        }
    }
    e.catchCallbackExceptions = !0, t.GTween = e;
}(fgui), function(t) {
    t.GTweener = class {
        constructor() {
            this._startValue = new t.TweenValue(), this._endValue = new t.TweenValue(), this._value = new t.TweenValue(), 
            this._deltaValue = new t.TweenValue(), this._reset();
        }
        setDelay(t) {
            return this._delay = t, this;
        }
        get delay() {
            return this._delay;
        }
        setDuration(t) {
            return this._duration = t, this;
        }
        get duration() {
            return this._duration;
        }
        setBreakpoint(t) {
            return this._breakpoint = t, this;
        }
        setEase(t) {
            return this._easeType = t, this;
        }
        setEasePeriod(t) {
            return this._easePeriod = t, this;
        }
        setEaseOvershootOrAmplitude(t) {
            return this._easeOvershootOrAmplitude = t, this;
        }
        setRepeat(t, e = !1) {
            return this._repeat = t, this._yoyo = e, this;
        }
        get repeat() {
            return this._repeat;
        }
        setTimeScale(t) {
            return this._timeScale = t, this;
        }
        setSnapping(t) {
            return this._snapping = t, this;
        }
        setTarget(t, e) {
            return this._target = t, this._propType = e, this;
        }
        get target() {
            return this._target;
        }
        setPath(t) {
            return this._path = t, this;
        }
        setUserData(t) {
            return this._userData = t, this;
        }
        get userData() {
            return this._userData;
        }
        onUpdate(t, e) {
            return this._onUpdate = t, this._onUpdateCaller = e, this;
        }
        onStart(t, e) {
            return this._onStart = t, this._onStartCaller = e, this;
        }
        onComplete(t, e) {
            return this._onComplete = t, this._onCompleteCaller = e, this;
        }
        get startValue() {
            return this._startValue;
        }
        get endValue() {
            return this._endValue;
        }
        get value() {
            return this._value;
        }
        get deltaValue() {
            return this._deltaValue;
        }
        get normalizedTime() {
            return this._normalizedTime;
        }
        get completed() {
            return 0 != this._ended;
        }
        get allCompleted() {
            return 1 == this._ended;
        }
        setPaused(t) {
            return this._paused = t, this;
        }
        seek(t) {
            if (!this._killed) {
                if (this._elapsedTime = t, this._elapsedTime < this._delay) {
                    if (!this._started) return;
                    this._elapsedTime = this._delay;
                }
                this.update();
            }
        }
        kill(t) {
            this._killed || (t && (0 == this._ended && (this._breakpoint >= 0 ? this._elapsedTime = this._delay + this._breakpoint : this._repeat >= 0 ? this._elapsedTime = this._delay + this._duration * (this._repeat + 1) : this._elapsedTime = this._delay + 2 * this._duration, 
            this.update()), this.callCompleteCallback()), this._killed = !0);
        }
        _to(t, e, i) {
            return this._valueSize = 1, this._startValue.x = t, this._endValue.x = e, this._value.x = t, 
            this._duration = i, this;
        }
        _to2(t, e, i, s, h) {
            return this._valueSize = 2, this._startValue.x = t, this._endValue.x = i, this._startValue.y = e, 
            this._endValue.y = s, this._value.x = t, this._value.y = e, this._duration = h, 
            this;
        }
        _to3(t, e, i, s, h, r, a) {
            return this._valueSize = 3, this._startValue.x = t, this._endValue.x = s, this._startValue.y = e, 
            this._endValue.y = h, this._startValue.z = i, this._endValue.z = r, this._value.x = t, 
            this._value.y = e, this._value.z = i, this._duration = a, this;
        }
        _to4(t, e, i, s, h, r, a, n, o) {
            return this._valueSize = 4, this._startValue.x = t, this._endValue.x = h, this._startValue.y = e, 
            this._endValue.y = r, this._startValue.z = i, this._endValue.z = a, this._startValue.w = s, 
            this._endValue.w = n, this._value.x = t, this._value.y = e, this._value.z = i, this._value.w = s, 
            this._duration = o, this;
        }
        _toColor(t, e, i) {
            return this._valueSize = 4, this._startValue.color = t, this._endValue.color = e, 
            this._value.color = t, this._duration = i, this;
        }
        _shake(t, e, i, s) {
            return this._valueSize = 5, this._startValue.x = t, this._startValue.y = e, this._startValue.w = i, 
            this._duration = s, this;
        }
        _init() {
            this._delay = 0, this._duration = 0, this._breakpoint = -1, this._easeType = t.EaseType.QuadOut, 
            this._timeScale = 1, this._easePeriod = 0, this._easeOvershootOrAmplitude = 1.70158, 
            this._snapping = !1, this._repeat = 0, this._yoyo = !1, this._valueSize = 0, this._started = !1, 
            this._paused = !1, this._killed = !1, this._elapsedTime = 0, this._normalizedTime = 0, 
            this._ended = 0;
        }
        _reset() {
            this._target = null, this._propType = null, this._userData = null, this._path = null, 
            this._onStart = this._onUpdate = this._onComplete = null, this._onStartCaller = this._onUpdateCaller = this._onCompleteCaller = null;
        }
        _update(t) {
            if (1 != this._timeScale && (t *= this._timeScale), 0 != t) {
                if (0 != this._ended) return this.callCompleteCallback(), void (this._killed = !0);
                this._elapsedTime += t, this.update(), 0 != this._ended && (this._killed || (this.callCompleteCallback(), 
                this._killed = !0));
            }
        }
        update() {
            if (this._ended = 0, 0 != this._valueSize) {
                if (!this._started) {
                    if (this._elapsedTime < this._delay) return;
                    if (this._started = !0, this.callStartCallback(), this._killed) return;
                }
                var i = !1, s = this._elapsedTime - this._delay;
                if (this._breakpoint >= 0 && s >= this._breakpoint && (s = this._breakpoint, this._ended = 2), 
                0 != this._repeat) {
                    var h = Math.floor(s / this._duration);
                    s -= this._duration * h, this._yoyo && (i = h % 2 == 1), this._repeat > 0 && this._repeat - h < 0 && (this._yoyo && (i = this._repeat % 2 == 1), 
                    s = this._duration, this._ended = 1);
                } else s >= this._duration && (s = this._duration, this._ended = 1);
                if (this._normalizedTime = t.evaluateEase(this._easeType, i ? this._duration - s : s, this._duration, this._easeOvershootOrAmplitude, this._easePeriod), 
                this._value.setZero(), this._deltaValue.setZero(), 5 == this._valueSize) if (0 == this._ended) {
                    var r = this._startValue.w * (1 - this._normalizedTime), a = r * (Math.random() > .5 ? 1 : -1), n = r * (Math.random() > .5 ? 1 : -1);
                    this._deltaValue.x = a, this._deltaValue.y = n, this._value.x = this._startValue.x + a, 
                    this._value.y = this._startValue.y + n;
                } else this._value.x = this._startValue.x, this._value.y = this._startValue.y; else if (this._path) {
                    var o = e;
                    this._path.getPointAt(this._normalizedTime, o), this._snapping && (o.x = Math.round(o.x), 
                    o.y = Math.round(o.y)), this._deltaValue.x = o.x - this._value.x, this._deltaValue.y = o.y - this._value.y, 
                    this._value.x = o.x, this._value.y = o.y;
                } else for (var l = 0; l < this._valueSize; l++) {
                    var _ = this._startValue.getField(l), d = _ + (this._endValue.getField(l) - _) * this._normalizedTime;
                    this._snapping && (d = Math.round(d)), this._deltaValue.setField(l, d - this._value.getField(l)), 
                    this._value.setField(l, d);
                }
                if (this._target && this._propType) if (this._propType instanceof Function) switch (this._valueSize) {
                  case 1:
                    this._propType.call(this._target, this._value.x);
                    break;

                  case 2:
                    this._propType.call(this._target, this._value.x, this._value.y);
                    break;

                  case 3:
                    this._propType.call(this._target, this._value.x, this._value.y, this._value.z);
                    break;

                  case 4:
                    this._propType.call(this._target, this._value.x, this._value.y, this._value.z, this._value.w);
                    break;

                  case 5:
                    this._propType.call(this._target, this._value.color);
                    break;

                  case 6:
                    this._propType.call(this._target, this._value.x, this._value.y);
                } else 5 == this._valueSize ? this._target[this._propType] = this._value.color : this._target[this._propType] = this._value.x;
                this.callUpdateCallback();
            } else this._elapsedTime >= this._delay + this._duration && (this._ended = 1);
        }
        callStartCallback() {
            if (null != this._onStart) try {
                this._onStart.call(this._onStartCaller, this);
            } catch (t) {
                console.log("FairyGUI: error in start callback > " + t);
            }
        }
        callUpdateCallback() {
            if (null != this._onUpdate) try {
                this._onUpdate.call(this._onUpdateCaller, this);
            } catch (t) {
                console.log("FairyGUI: error in update callback > " + t);
            }
        }
        callCompleteCallback() {
            if (null != this._onComplete) try {
                this._onComplete.call(this._onCompleteCaller, this);
            } catch (t) {
                console.log("FairyGUI: error in complete callback > " + t);
            }
        }
    };
    var e = new Laya.Point();
}(fgui), function(t) {
    class e {
        static createTween() {
            var a;
            return r || (Laya.timer.frameLoop(1, null, e.update), r = !0), (a = s.length > 0 ? s.pop() : new t.GTweener())._init(), 
            i[h++] = a, a;
        }
        static isTweening(t, e) {
            if (null == t) return !1;
            for (var s = !e, r = 0; r < h; r++) {
                var a = i[r];
                if (a && a.target == t && !a._killed && (s || a._propType == e)) return !0;
            }
            return !1;
        }
        static killTweens(t, e, s) {
            if (null == t) return !1;
            for (var r = !1, a = h, n = !s, o = 0; o < a; o++) {
                var l = i[o];
                !l || l.target != t || l._killed || !n && l._propType != s || (l.kill(e), r = !0);
            }
            return r;
        }
        static getTween(t, e) {
            if (null == t) return null;
            for (var s = h, r = !e, a = 0; a < s; a++) {
                var n = i[a];
                if (n && n.target == t && !n._killed && (r || n._propType == e)) return n;
            }
            return null;
        }
        static update() {
            for (var e = Laya.timer.delta / 1e3, r = h, a = -1, n = 0; n < r; n++) {
                var o = i[n];
                null == o ? -1 == a && (a = n) : o._killed ? (o._reset(), s.push(o), i[n] = null, 
                -1 == a && (a = n)) : (o._target instanceof t.GObject && o._target.isDisposed ? o._killed = !0 : o._paused || o._update(e), 
                -1 != a && (i[a] = o, i[n] = null, a++));
            }
            if (a >= 0) {
                if (h != r) {
                    var l = r;
                    for (r = h - r, n = 0; n < r; n++) i[a++] = i[l++];
                }
                h = a;
            }
        }
    }
    t.TweenManager = e;
    var i = [], s = [], h = 0, r = !1;
}(fgui), function(t) {
    t.TweenValue = class {
        constructor() {
            this.x = this.y = this.z = this.w = 0;
        }
        get color() {
            return (this.w << 24) + (this.x << 16) + (this.y << 8) + this.z;
        }
        set color(t) {
            this.x = (16711680 & t) >> 16, this.y = (65280 & t) >> 8, this.z = 255 & t, this.w = (4278190080 & t) >> 24;
        }
        getField(t) {
            switch (t) {
              case 0:
                return this.x;

              case 1:
                return this.y;

              case 2:
                return this.z;

              case 3:
                return this.w;

              default:
                throw new Error("Index out of bounds: " + t);
            }
        }
        setField(t, e) {
            switch (t) {
              case 0:
                this.x = e;
                break;

              case 1:
                this.y = e;
                break;

              case 2:
                this.z = e;
                break;

              case 3:
                this.w = e;
                break;

              default:
                throw new Error("Index out of bounds: " + t);
            }
        }
        setZero() {
            this.x = this.y = this.z = this.w = 0;
        }
    };
}(fgui), function(t) {
    class e extends Laya.Byte {
        constructor(t, e, i) {
            e = e || 0, null != i && -1 != i || (i = t.byteLength - e), 0 == e && i == t.byteLength ? super(t) : (super(), 
            this._u8d_ = new Uint8Array(t, e, i), this._d_ = new DataView(this._u8d_.buffer, e, i), 
            this._length = i), this.endian = Laya.Byte.BIG_ENDIAN;
        }
        skip(t) {
            this.pos += t;
        }
        readBool() {
            return 1 == this.getUint8();
        }
        readS() {
            var t = this.getUint16();
            return 65534 == t ? null : 65533 == t ? "" : this.stringTable[t];
        }
        readSArray(t) {
            for (var e = new Array(t), i = 0; i < t; i++) e[i] = this.readS();
            return e;
        }
        writeS(t) {
            var e = this.getUint16();
            65534 != e && 65533 != e && (this.stringTable[e] = t);
        }
        readColor(t) {
            var e = this.getUint8(), i = this.getUint8(), s = this.getUint8(), h = this.getUint8();
            return (t ? h << 24 : 0) + (e << 16) + (i << 8) + s;
        }
        readColorS(t) {
            var e = this.getUint8(), i = this.getUint8(), s = this.getUint8(), h = this.getUint8();
            if (t && 255 != h) return "rgba(" + e + "," + i + "," + s + "," + h / 255 + ")";
            var r = e.toString(16), a = i.toString(16), n = s.toString(16);
            return 1 == r.length && (r = "0" + r), 1 == a.length && (a = "0" + a), 1 == n.length && (n = "0" + n), 
            "#" + r + a + n;
        }
        readChar() {
            var t = this.getUint16();
            return String.fromCharCode(t);
        }
        readBuffer() {
            var t = this.getUint32(), i = new e(this.buffer, this._pos_, t);
            return this.pos += t, i.stringTable = this.stringTable, i.version = this.version, 
            i;
        }
        seek(t, e) {
            var i, s = this._pos_;
            return this.pos = t, e < this.getUint8() ? (1 == this.getUint8() ? (this.pos += 2 * e, 
            i = this.getUint16()) : (this.pos += 4 * e, i = this.getUint32()), i > 0 ? (this.pos = t + i, 
            !0) : (this.pos = s, !1)) : (this.pos = s, !1);
        }
    }
    t.ByteBuffer = e;
}(fgui), function(t) {
    let e = Laya.HitArea._isHitGraphic;
    t.ChildHitArea = class extends Laya.HitArea {
        constructor(t, e) {
            super(), this._child = t, this._reversed = e, this._reversed ? this.unHit = t.hitArea.hit : this.hit = t.hitArea.hit;
        }
        contains(t, i) {
            var s;
            return (s = Laya.Point.TEMP).setTo(0, 0), s = this._child.toParentPoint(s), this._reversed ? !e(t - s.x, i - s.y, this.unHit) : e(t - s.x, i - s.y, this.hit);
        }
    };
}(fgui), function(t) {
    class e {
        constructor(t, e, i, h) {
            this.matrix = new Array(s), this.reset(), void 0 === t && void 0 === e && void 0 === i && void 0 === h || this.adjustColor(t, e, i, h);
        }
        reset() {
            for (var t = 0; t < s; t++) this.matrix[t] = i[t];
        }
        invert() {
            this.multiplyMatrix([ -1, 0, 0, 0, 255, 0, -1, 0, 0, 255, 0, 0, -1, 0, 255, 0, 0, 0, 1, 0 ]);
        }
        adjustColor(t, e, i, s) {
            this.adjustHue(s || 0), this.adjustContrast(e || 0), this.adjustBrightness(t || 0), 
            this.adjustSaturation(i || 0);
        }
        adjustBrightness(t) {
            t = 255 * this.cleanValue(t, 1), this.multiplyMatrix([ 1, 0, 0, 0, t, 0, 1, 0, 0, t, 0, 0, 1, 0, t, 0, 0, 0, 1, 0 ]);
        }
        adjustContrast(t) {
            var e = (t = this.cleanValue(t, 1)) + 1, i = 128 * (1 - e);
            this.multiplyMatrix([ e, 0, 0, 0, i, 0, e, 0, 0, i, 0, 0, e, 0, i, 0, 0, 0, 1, 0 ]);
        }
        adjustSaturation(t) {
            t = this.cleanValue(t, 1);
            var e = 1 - (t += 1), i = e * h, s = e * r, n = e * a;
            this.multiplyMatrix([ i + t, s, n, 0, 0, i, s + t, n, 0, 0, i, s, n + t, 0, 0, 0, 0, 0, 1, 0 ]);
        }
        adjustHue(t) {
            t = this.cleanValue(t, 1), t *= Math.PI;
            var e = Math.cos(t), i = Math.sin(t);
            this.multiplyMatrix([ h + e * (1 - h) + i * -h, r + e * -r + i * -r, a + e * -a + i * (1 - a), 0, 0, h + e * -h + .143 * i, r + e * (1 - r) + .14 * i, a + e * -a + -.283 * i, 0, 0, h + e * -h + i * -(1 - h), r + e * -r + i * r, a + e * (1 - a) + i * a, 0, 0, 0, 0, 0, 1, 0 ]);
        }
        concat(t) {
            t.length == s && this.multiplyMatrix(t);
        }
        clone() {
            var t = new e();
            return t.copyMatrix(this.matrix), t;
        }
        copyMatrix(t) {
            for (var e = s, i = 0; i < e; i++) this.matrix[i] = t[i];
        }
        multiplyMatrix(t) {
            for (var e = [], i = 0, s = 0; s < 4; ++s) {
                for (var h = 0; h < 5; ++h) e[i + h] = t[i] * this.matrix[h] + t[i + 1] * this.matrix[h + 5] + t[i + 2] * this.matrix[h + 10] + t[i + 3] * this.matrix[h + 15] + (4 == h ? t[i + 4] : 0);
                i += 5;
            }
            this.copyMatrix(e);
        }
        cleanValue(t, e) {
            return Math.min(e, Math.max(-e, t));
        }
    }
    t.ColorMatrix = e;
    const i = [ 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0 ], s = i.length, h = .299, r = .587, a = .114;
}(fgui), function(t) {
    t.PixelHitTest = class extends Laya.HitArea {
        constructor(t, e, i) {
            super(), this._data = t, this.offsetX = e, this.offsetY = i, this.scaleX = 1, this.scaleY = 1;
        }
        contains(t, e) {
            if (t = Math.floor((t / this.scaleX - this.offsetX) * this._data.scale), e = Math.floor((e / this.scaleY - this.offsetY) * this._data.scale), 
            t < 0 || e < 0 || t >= this._data.pixelWidth) return !1;
            var i = e * this._data.pixelWidth + t, s = Math.floor(i / 8), h = i % 8;
            return s >= 0 && s < this._data.pixels.length && 1 == (this._data.pixels[s] >> h & 1);
        }
    };
    t.PixelHitTestData = class {
        constructor() {}
        load(t) {
            t.getInt32(), this.pixelWidth = t.getInt32(), this.scale = 1 / t.readByte();
            var e = t.getInt32();
            this.pixels = [];
            for (var i = 0; i < e; i++) {
                var s = t.readByte();
                s < 0 && (s += 256), this.pixels[i] = s;
            }
        }
    };
}(fgui), function(t) {
    class e {
        constructor() {
            this._readPos = 0, this.defaultImgWidth = 0, this.defaultImgHeight = 0, this._handlers = {}, 
            this._handlers.url = this.onTag_URL, this._handlers.img = this.onTag_IMG, this._handlers.b = this.onTag_B, 
            this._handlers.i = this.onTag_I, this._handlers.u = this.onTag_U, this._handlers.sup = this.onTag_Simple, 
            this._handlers.sub = this.onTag_Simple, this._handlers.color = this.onTag_COLOR, 
            this._handlers.font = this.onTag_FONT, this._handlers.size = this.onTag_SIZE;
        }
        onTag_URL(t, e, i) {
            return e ? "</a>" : null != i ? '<a href="' + i + '" target="_blank">' : '<a href="' + this.getTagText() + '" target="_blank">';
        }
        onTag_IMG(t, e, i) {
            if (e) return null;
            var s = this.getTagText(!0);
            return s ? this.defaultImgWidth ? '<img src="' + s + '" width="' + this.defaultImgWidth + '" height="' + this.defaultImgHeight + '"/>' : '<img src="' + s + '"/>' : null;
        }
        onTag_B(t, e, i) {
            return e ? "</span>" : "<span style='font-weight:bold'>";
        }
        onTag_I(t, e, i) {
            return e ? "</span>" : "<span style='font-style:italic'>";
        }
        onTag_U(t, e, i) {
            return e ? "</span>" : "<span style='text-decoration:underline'>";
        }
        onTag_Simple(t, e, i) {
            return e ? "</" + t + ">" : "<" + t + ">";
        }
        onTag_COLOR(t, e, i) {
            return e ? "</span>" : (this.lastColor = i, '<span style="color:' + i + '">');
        }
        onTag_FONT(t, e, i) {
            return e ? "</span>" : '<span style="font-family:' + i + '">';
        }
        onTag_SIZE(t, e, i) {
            return e ? "</span>" : (this.lastSize = i, '<span style="font-size:' + i + '">');
        }
        getTagText(t) {
            for (var e, i = this._readPos, s = ""; -1 != (e = this._text.indexOf("[", i)); ) {
                if (92 != this._text.charCodeAt(e - 1)) {
                    s += this._text.substring(i, e);
                    break;
                }
                s += this._text.substring(i, e - 1), s += "[", i = e + 1;
            }
            return -1 == e ? null : (t && (this._readPos = e), s);
        }
        parse(t, e) {
            this._text = t, this.lastColor = null, this.lastSize = null;
            for (var i, s, h, r, a, n, o, l = 0, _ = ""; -1 != (i = this._text.indexOf("[", l)); ) if (i > 0 && 92 == this._text.charCodeAt(i - 1)) _ += this._text.substring(l, i - 1), 
            _ += "[", l = i + 1; else {
                if (_ += this._text.substring(l, i), l = i, -1 == (i = this._text.indexOf("]", l))) break;
                h = "/" == this._text.charAt(l + 1), r = this._text.substring(h ? l + 2 : l + 1, i), 
                this._readPos = i + 1, a = null, n = null, -1 != (s = r.indexOf("=")) && (a = r.substring(s + 1), 
                r = r.substring(0, s)), r = r.toLowerCase(), null != (o = this._handlers[r]) ? e || null != (n = o.call(this, r, h, a)) && (_ += n) : _ += this._text.substring(l, this._readPos), 
                l = this._readPos;
            }
            return l < this._text.length && (_ += this._text.substr(l)), this._text = null, 
            _;
        }
    }
    e.inst = new e(), t.UBBParser = e;
}(fgui), function(t) {
    t.ToolSet = class {
        static startsWith(t, e, i) {
            return !(!t || t.length < e.length || (t = t.substring(0, e.length), i ? t.toLowerCase() != e.toLowerCase() : t != e));
        }
        static endsWith(t, e, i) {
            return !(!t || t.length < e.length || (t = t.substring(t.length - e.length), i ? t.toLowerCase() != e.toLowerCase() : t != e));
        }
        static trimRight(t) {
            for (var e = "", i = t.length - 1; i >= 0 && (" " == (e = t.charAt(i)) || "\n" == e || "\r" == e); i--) ;
            return t.substring(0, i + 1);
        }
        static convertToHtmlColor(t, e) {
            var i;
            i = e ? (t >> 24 & 255).toString(16) : "";
            var s = (t >> 16 & 255).toString(16), h = (t >> 8 & 255).toString(16), r = (255 & t).toString(16);
            return 1 == i.length && (i = "0" + i), 1 == s.length && (s = "0" + s), 1 == h.length && (h = "0" + h), 
            1 == r.length && (r = "0" + r), "#" + i + s + h + r;
        }
        static convertFromHtmlColor(t, e) {
            return t.length < 1 ? 0 : ("#" == t.charAt(0) && (t = t.substr(1)), 8 == t.length ? (parseInt(t.substr(0, 2), 16) << 24) + parseInt(t.substr(2), 16) : e ? 4278190080 + parseInt(t, 16) : parseInt(t, 16));
        }
        static displayObjectToGObject(t) {
            for (;t && !(t instanceof Laya.Stage); ) {
                if (t.$owner) return t.$owner;
                t = t.parent;
            }
            return null;
        }
        static encodeHTML(t) {
            return t ? t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&apos;").replace(/"/g, "&quot;") : "";
        }
        static clamp(t, e, i) {
            return t < e ? t = e : t > i && (t = i), t;
        }
        static clamp01(t) {
            return isNaN(t) ? t = 0 : t > 1 ? t = 1 : t < 0 && (t = 0), t;
        }
        static lerp(t, e, i) {
            return t + i * (e - t);
        }
        static repeat(t, e) {
            return t - Math.floor(t / e) * e;
        }
        static distance(t, e, i, s) {
            return Math.sqrt(Math.pow(t - i, 2) + Math.pow(e - s, 2));
        }
        static setColorFilter(i, s) {
            var h, r, a, n, o, l, _, d = i.$_colorFilter_, c = i.filters, u = typeof s;
            if ("boolean" == u) h = d ? d.$_color_ : null, r = s; else {
                if ("string" == u) {
                    var g = Laya.ColorUtils.create(s).arrColor;
                    s = 1 == g[0] && 1 == g[1] && 1 == g[2] ? null : [ g[0], 0, 0, 0, 0, 0, g[1], 0, 0, 0, 0, 0, g[2], 0, 0, 0, 0, 0, 1, 0 ];
                }
                h = s, r = !!d && d.$_grayed_;
            }
            if (h || 0 == h || r) d || (d = new Laya.ColorFilter(), i.$_colorFilter_ = d), c ? -1 == c.indexOf(d) && c.push(d) : c = [ d ], 
            i.filters = c, d.$_color_ = h, d.$_grayed_ = r, d.reset(), r ? d.gray() : 20 == h.length ? d.setByMatrix(h) : d.setByMatrix((a = h[0], 
            n = h[1], o = h[2], l = h[3], _ = _ || new Array(t.ColorMatrix.length), e.reset(), 
            e.adjustColor(a, n, o, l), e.matrix.forEach((t, e) => _[e] = t), _)); else if (c && d) {
                let t = c.indexOf(d);
                -1 != t && (c.splice(t, 1), c.length > 0 ? i.filters = c : i.filters = null);
            }
        }
    };
    let e = new t.ColorMatrix();
}(fgui);