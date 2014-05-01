(function($$, window){ 'use strict';

  function ready(f) {
    var fn = ( document && (document.readyState === 'interactive' || document.readyState === 'complete') )  ? f : ready;

    setTimeout(fn, 9, f);
  }

  $$.fn.core({
    add: function(opts){
      
      var elements;
      var cy = this;
      
      // add the elements
      if( $$.is.elementOrCollection(opts) ){
        var eles = opts;

        if( eles._private.cy === cy ){ // same instance => just restore
          elements = eles.restore();

        } else { // otherwise, copy from json
          var jsons = [];

          for( var i = 0; i < eles.length; i++ ){
            var ele = eles[i];
            jsons.push( ele.json() );
          }

          elements = new $$.Collection( cy, jsons );
        }
      }
      
      // specify an array of options
      else if( $$.is.array(opts) ){
        var jsons = opts;

        elements = new $$.Collection(cy, jsons);
      }
      
      // specify via opts.nodes and opts.edges
      else if( $$.is.plainObject(opts) && ($$.is.array(opts.nodes) || $$.is.array(opts.edges)) ){
        var elesByGroup = opts;
        var jsons = [];

        var grs = ['nodes', 'edges'];
        for( var i = 0, il = grs.length; i < il; i++ ){
          var group = grs[i];
          var elesArray = elesByGroup[group];

          if( $$.is.array(elesArray) ){

            for( var j = 0, jl = elesArray.length; j < jl; j++ ){
              var json = elesArray[j];

              var mjson = $$.util.extend({}, json, { group: group });
              jsons.push( mjson );
            }
          } 
        }

        elements = new $$.Collection(cy, jsons);
      }
      
      // specify options for one element
      else {
        var json = opts;
        elements = (new $$.Element( cy, json )).collection();
      }
      
      return elements;
    },
    
    remove: function(collection){
      if( $$.is.elementOrCollection(collection) ){
        collection = collection;
      } else if( $$.is.string(collection) ){
        var selector = collection;
        collection = this.$( selector );
      }
      
      return collection.remove();
    },
    
    load: function(elements, onload, ondone){
      var cy = this;
      
      // remove old elements
      var oldEles = cy.elements();
      if( oldEles.length > 0 ){
        oldEles.remove();
      }

      cy.notifications(false);
      
      if( elements != null ){
        if( $$.is.plainObject(elements) || $$.is.array(elements) ){
          cy.add( elements );
        } 
      }
      
      function callback(){        
        cy.one('layoutready', function(e){
          cy.notifications(true);
          cy.trigger(e); // we missed this event by turning notifications off, so pass it on

          cy.notify({
            type: 'load',
            collection: cy.elements()
          });

          cy.one('load', onload);
          cy.trigger('load');
        }).one('layoutstop', function(){
          cy.one('done', ondone);
          cy.trigger('done');
        });
        
        cy.layout( cy._private.options.layout );

      }

      if( window ){
        ready( callback );
      } else {
        callback();
      }

      return this;
    },

    batchMove: function( id2struct ){
      var cy = this;
      var eles = this._private.elements;
      
      // get eles to move as collection
      var bEles = [];
      for( var i = 0; i < eles.length; i++ ){
        var ele = eles[i];
        var id = ele._private.data.id;

        if( id2struct[ id ] ){
          bEles.push( ele );
        }
      }
      eles = new $$.Collection(cy, bEles);

      // get jsons and remove
      var jsons = eles.jsons();
      eles.remove();

      // modify jsons as per structs
      for( var i = 0; i < eles.length; i++ ){
        var ele = eles[i];
        var json = jsons[i];
        var id = ele._private.data.id;
        var ms = id2struct[ id ];
        var isNode = ele._private.group === 'nodes';
        var isEdge = !isNode;

        if( ms ){
          if( isEdge ){
            if( ms.source && cy.getElementById(ms.source).length > 0 ){
              json.data.source = ms.source;
            }
            
            if( ms.target && cy.getElementById(ms.target).length > 0 ){
              json.data.target = ms.target;
            }

          } else if( isNode && ms.parent ){
            json.data.parent = ms.parent;
          }
        }
      }

      // add modified eles back in
      return cy.add( jsons );
    }
  });
  
})( cytoscape, typeof window === 'undefined' ? null : window );