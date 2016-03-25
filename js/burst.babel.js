import Transit from './transit';
import Swirl from './swirl';
import h     from './h';

class Burst extends Swirl {
  /*
    Method to declare defaults.
    @override @ Swirl.
  */
  _declareDefaults () {
    // call super @ Swirl
    super._declareDefaults();
    // child defaults declaration
    this._declareChildDefaults();

    /* _DEFAULTS ARE - SWIRL DEFAULTS + THESE: */

    /* :: [number > 0] :: Amount of Burst's points. */
    this._defaults.count        = 5;
    /* :: [0 < number < 360] :: Degree of the Burst. */
    this._defaults.degree       = 360;
    /* ∆ :: [number > 0] :: Degree for the Burst's points */
    this._defaults.radius       = { 5: 50 };

    /* childOptions PROPERTIES ARE -
      `Swirl` DEFAULTS + `Tween` DEFAULTS.
      ONLY `isSwirl` option is `false` by default. */

    // add options intersection hash - map that holds the property
    // names that could be on both parent module and child ones,
    // so setting one of those on parent, affect parent only
    this._optionsIntersection = {
      radius: 1, radiusX: 1, radiusY: 1,
      angle:  1, scale:   1, opacity: 1,
    }
  }
  /*
    Method to copy _o options to _props with fallback to _defaults.
    @private
    @override @ Swirl
  */
  _extendDefaults () {
    // call super extendDefaults on Swirl
    super._extendDefaults();
    // calc size immedietely, the Swirls' options rely on size
    this._calcSize();
  }
  /*
    Method to declare `childDefaults` for `childOptions` object.
    @private
  */
  _declareChildDefaults () {
    /* CHILD DEFAULTS - SWIRL's DEFAULTS WITH ADDITIONS*/
    // copy the defaults to the childDefaults property
    this._childDefaults = h.cloneObj( this._defaults );
    // [boolean] :: If shape should follow sinusoidal path.
    this._childDefaults.isSwirl = false;
    // copy tween options and callbacks
    for (var key in h.tweenOptionMap) { this._childDefaults[key] = null; }
    for (var key in h.callbacksMap)   { this._childDefaults[key] = null; }
  }
  /*
    Method to create child transits.
    @private
    @override Transit
  */
  _createBit () {
    this._swirls = [];
    for (var index = 0; index < this._props.count; index++) {
      this._swirls.push( new Swirl( this._getOption( index ) ) );
    }
  }
  /*
    Method to calculate option for specific transit.
    @private
    @param {Number} Index of the swirl.
  */
  _getOption (i) {
    var option  = {};

    for (var key in this._childDefaults) {
      // this is priorty for the property lookup
      // firstly try to find the prop in this._o.childOptions
      var prop = this._getPropByMod( key, i, this._o.childOptions );
      // if non-intersected option - need to check in _o
      prop = ( prop == null && !this._optionsIntersection[key] )
        ? this._getPropByMod( key, i, this._o ) : prop;
      // lastly fallback to defaults
      prop = ( prop == null )
        ? this._getPropByMod( key, i, this._childDefaults ) : prop;
      // parse `stagger` and `rand` values if needed
      option[key] = h.parseStringOption(prop, i);
    }

    return this._addOptionalProperties( option, i );
  }
  /*
    Method to add optional Swirls' properties to passed object.
    @private
    @param {Object} Object to add the properties to.
    @param {Number} Index of the property.
  */
  _addOptionalProperties (options, index) {
    options.index          = index;
    options.left           = '50%';
    options.top            = '50%';
    options.parent         = this.el;
    options.isTimelineLess = true;
    // option.callbacksContext = this;  ?

    var p          = this._props,
        points     = p.count,
        degreeCnt  = (p.degree % 360 === 0) ? points : points-1 || 1,
        step       = p.degree/degreeCnt,
        pointStart = this._getSidePoint('start', index*step ),
        pointEnd   = this._getSidePoint('end',   index*step );

    options.x     = this._getDeltaFromPoints('x', pointStart, pointEnd);
    options.y     = this._getDeltaFromPoints('y', pointStart, pointEnd);
    options.angle = this._getBitAngle( options.angle, index );

    return options;
  }
  /* 
    Method to get transits angle in burst so
    it will follow circular shape.
     
     @param    {Number, Object} Base angle.
     @param    {Number}         Transit's index in burst.
     @returns  {Number}         Angle in burst.
  */ 
  _getBitAngle (angleProperty, i) {
    var p      = this._props,
        degCnt = ( p.degree % 360 === 0 ) ? p.count : p.count-1 || 1,
        step   = p.degree/degCnt,
        angle  = i*step + 90;
    // if not delta option
    if ( !this._isDelta(angleProperty) ) { angleProperty += angle; }
    else {
      var delta = {},
          keys  = Object.keys(angleProperty),
          start = keys[0],
          end   = angleProperty[start];
      
      start = h.parseStringOption(start, i);
      end   = h.parseStringOption(end, i);
      // new start = newEnd
      delta[ parseFloat(start) + angle ] = parseFloat(end) + angle;

      angleProperty = delta;
    }
    return angleProperty;
  }
  /*
    Method to get radial point on `start` or `end`.
    @private
    @param {String} Name of the side - [start, end].
    @param {Number} Angle of the radial point.
    @returns radial point.
  */
  _getSidePoint (side, angle) {
    var p          = this._props,
        sideRadius = this._getSideRadius(side);

    return h.getRadialPoint({
      radius:  sideRadius.radius,
      radiusX: sideRadius.radiusX,
      radiusY: sideRadius.radiusY,
      angle:   angle,
      center:  { x: p.center, y: p.center }
    });
  }
  /*
    Method to get radius of the side.
    @private
    @param {String} Name of the side - [start, end].
    @returns {Object} Radius.
  */
  _getSideRadius ( side ) {
    return {
      radius:  this._getRadiusByKey('radius',  side),
      radiusX: this._getRadiusByKey('radiusX', side),
      radiusY: this._getRadiusByKey('radiusY', side)
    }
  }
  /*
    Method to get radius from ∆ or plain property.
    @private
    @param {String} Key name.
    @param {String} Side name - [start, end].
  */
  _getRadiusByKey (key, side) {
    if ( this._deltas[key] != null ) { return this._deltas[key][side]; }
    else if ( this._props[key] != null ) { return this._props[key]; }
  }
  /*
    Method to get delta from start and end position points.
    @private
    @param {String} Key name.
    @param {Object} Start position point.
    @param {Object} End position point.
    @returns {Object} Delta of the end/start.
  */
  _getDeltaFromPoints (key, pointStart, pointEnd) {
    var delta = {};
    if ( pointStart[key] === pointEnd[key] ) {
      delta = pointStart[key];
    } else { delta[pointStart[key]] = pointEnd[key]; }
    return delta;
  }
  /*
    Method to get property by modulus.
    @private
    @param {String} Name of the property.
    @param {Number} Index for the modulus.
    @param {Object} Source object to check in.
    @returns {Any} Property.
  */
  _getPropByMod ( name, index, sourceObj = {} ) {
    var prop   = sourceObj[name];
    return h.isArray(prop) ? prop[index % prop.length] : prop;
  }
  /*
    Method to draw self DIV element.
    @private
    @override @ Transit
  */
  _draw () { this._drawEl(); }
  /*
    Method to calculate maximum size of element.
    @private
    @override @ Transit
  */
  _calcSize () {
    var p = this._props;
    p.size   = ( p.size == null ) ? 2 : p.size;
    p.center = p.size / 2;
  }
  /*
    Method to setup  timeline options before creating the Timeline instance.
    @override @ Transit
    @private
  */
  _transformTweenOptions () {
    this._o.timeline = this._o.timeline || {};
    this._applyCallbackOverrides( this._o.timeline );
  }
  /*
    Method to create timeline.
    @private
    @override @ Tweenable
    @param {Object} Timeline's options.
                    An object which contains "timeline" property with
                    timeline options.
  */
  _makeTimeline () {
    super._makeTimeline();
    this.timeline.add( ...this._swirls );
    this._o.timeline = null;
  }
  /*
    Method to make Tween for the module.
    @private
    @override @ Tweenable
  */
  _makeTween () { /* don't create any tween */ }
  /*
    Method to tune new history options to all the submodules.
    @private
    @override @ Tunable
  */
  _tuneSubModules () {
    // call _tuneSubModules on Tunable
    super._tuneSubModules();
    // tune swirls including their tweens
    for (var index = 0; index < this._swirls.length; index++) {
      var swirl   = this._swirls[index],
          options = this._getOption( index );

      swirl._tuneNewOptions( options );
      this._resetTween( swirl.tween, options );
    }
    
    this._o.timeline && this.timeline._setProp(this._o.timeline);
    this.timeline._recalcTotalDuration();
  }

  

  _resetTweens () {}
}

export default Burst;







  // /*
  //   Method to get if need to update new transform.
  //   @private
  //   @returns {Boolean} If transform update needed.
  // */
  // // _isNeedsTransform () {
  // //   return  this._isPropChanged('x') ||
  // //           this._isPropChanged('y') ||
  // //           this._isPropChanged('angle');
  // // }
  /*
    Method to run tween with new options.
    @public
    @param {Object} New options object.
    @returns {Object} this.
  */
  // run ( o ) {
  //   if ( o != null && Object.keys(o).length) {
  //     if ( o.count || ( o.childOptions && o.childOptions.count )) {
  //       h.warn('Sorry, count can not be changed on run');
  //     }
  //     this._extendDefaults(o);
  //     // copy child options to options
  //     var keys = Object.keys(o.childOptions || {});
      
  //     if ( this._o.childOptions == null ) { this._o.childOptions = {}; }

  //     for (var i = 0; i < keys.length; i++) {
  //       var key = keys[i];
  //       this._o.childOptions[key] = o.childOptions[key];
  //     }
  //     // tune transits
  //     var len = this._swirls.length;
  //     while(len--) {
  //       // we should keep transit's angle otherwise
  //       // it will fallback to default 0 value
  //       var option = this._getOption(len),
  //           ref;

  //       if ( (((ref = o.childOptions) != null ? ref.angle : void 0) == null) && ( o.angleShift == null ) ) {
  //         option.angle = this._swirls[len]._o.angle;
  //       }
  //       // calculate bit angle if new angle related option passed
  //       // and not isResetAngles
  //       else if ( !o.isResetAngles ) {
  //         option.angle = this._getBitAngle(option.angle, len);
  //       }
  //       this._swirls[len]._tuneNewOption(option, true);
  //     }
  //     this.timeline._recalcTotalDuration()
  //   }
  //   if ( this._props.randomAngle || this._props.randomRadius ) {
  //     var len = this._swirls.length;
  //     while(len--) {
  //       var tr = this._swirls[len];
  //       this._props.randomAngle  && tr._setProp({angleShift:  this._generateRandomAngle()});
  //       this._props.randomRadius && tr._setProp({radiusScale: this._generateRandomRadius()})
  //     }
  //   }
  //   this.play();
  //   return this;
  // }
  /*
    Method to create then chain record.
    @private
    returns {Object} this.
  */
  // then (o) {
  //   h.error(`Burst's \"then\" method is under consideration,
  //     you can vote for it in github repo issues`);
  //   // 1. merge @o and o
  //   // 2. get i option from merged object
  //   // 3. pass the object to transit then
  //   // 4. transform self chain on run
  //   // i = this._swirls.length
  //   // while(i--) { this._swirls[i].then(o); }
  //   //   
  //   return this;
  // }