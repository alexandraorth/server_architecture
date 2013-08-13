var frozen = new Boolean();

var TimemodelApp = {
  Models: {},
  Collections: {},
  Views: {},
  Templates: {}
};


TimemodelApp.Models.Timemodel = Backbone.Model.extend({
  defaults: {
  
  },
  initialize: function(){

  }
});

TimemodelApp.Models.Application = Backbone.Model.extend({
  defaults: {
  
  },
  initialize: function(){

  }
});

TimemodelApp.Models.Node = Backbone.Model.extend({
  defaults: {
  },
  initialize: function(){

  }
});

TimemodelApp.Models.Serverset = Backbone.Model.extend({
  defaults:{

  },
  initialize: function(){

  }
});

var TimemodelCollection = Backbone.Collection.extend({
  model: TimemodelApp.Models.Timemodel,
  url: "/api/timemodel"
});

var NodesCollection = Backbone.Collection.extend({
  initialize: function(models, options){
    this.id = options.id
  },
  model: TimemodelApp.Models.Node,
  url: function(){
    return '/api/timemodel/' + this.id + '/nodes'
  }
});

var ApplicationCollection = Backbone.Collection.extend({
  initialize: function(models, options){
  },
  model: TimemodelApp.Models.Application,
  url: function(){
    return '/api/application'
  }
});

var ConnectedNodesCollection = Backbone.Collection.extend({
  initialize: function(models, options){
    this.id = options.id
    this.node_name = options.node_name
  },
  model: TimemodelApp.Models.Node,
  url: function(){
    return '/api/timemodel/' + this.id + '/node/' + this.node_name
  }
});

var ServersetCollection = Backbone.Collection.extend({
  initialize: function(models, options){
  },
  model: TimemodelApp.Models.Serverset,
  url: function(){
    return '/api/serverset'
  }
});


var TimemodelView1 = Backbone.View.extend({
  el: $('html'),
  events: {
    'click #server-container .list-group .nodeButton': 'nodeButtonClick',
    'click #application-container .list-group .appButton': 'appButtonClick',
    'click .setButton' : 'setButtonClick',
    'click .clear': 'clear',
    'click .freeze': 'freeze',
    'click .removeSingleNodes' : 'removeSingles'
  },
  initialize: function(){
    _.bindAll(this, 'render')
    this.render();
  },
  render: function(){
    fetch.done(function(){

      main_collection.forEach(function(model){
        $(this.el).append("This is the time " + model.get('time'));
        $('#time-container .list-group').append("<a href='#' class='list-group-item' class='test_button' data-id='" 
          + model.get('_id') + "'>" + model.get('time') + "</a>")
      })

      $('#timemodel-container').html($(this.el).html());

      click(main_collection.models[0].get('_id'), main_collection.models[0].get('time'))
    })

    var self = this;
    var length = main_collection.length

    $(function(){
      $("#slider-horizontal").slider({
        orientation: 'horizontal',
        range: 'min',
        min: 0,
        max: 100,
        slide: self.updateSlider
      });
    })

  },
  freeze: function(){
    if(frozen == true){
      frozen = false;
      force.start();
    }
    else if(frozen == false){
      frozen = true;
      force.stop();
    }
  },
  removeSingles: function(){

    //if you want to hide servers
    if($('.removeSingleNodes').attr('check') == 'false'){
      $('.removeSingleNodes').attr('check', 'true');

      //go through each node
      $('.node').each(function(target){
        //to find if it is a server
        if($(this).children()[0].r.animVal.value <= 8){
          $(this).css("display", "none");

          //save reference to the node, os you can test for location
          var holder = this

          //hide any links that have a starting point in the same location as the node
          $('.link').each(function(line){
            if($(holder).attr("transform").split(/\((.*?)\)/g)[1].split(",")[0] ==
              $(this).attr("x1")
              ||
              $(holder).attr("transform").split(/\((.*?)\)/g)[1].split(",")[0] ==
              $(this).attr("x2")){
              $(this).css("display", "none")
            }
          });
        }
      });
    }

    //if you want to show servers
    else{

      $('.removeSingleNodes').attr('check', 'false');

      $('.node').each(function(target){
        if($(this).children()[0].r.animVal.value <= 8){
          $(this).css("display", "block");

          var holder = this

          //show links
          $('.link').each(function(line){
            if($(holder).attr("transform").split(/\((.*?)\)/g)[1].split(",")[0] ==
              $(this).attr("x1")
              ||
              $(holder).attr("transform").split(/\((.*?)\)/g)[1].split(",")[0] ==
              $(this).attr("x2")){
              $(this).css("display", "block")
            }
          }); 
        }
      });
    }

    restart();
    
  },
  clear: function(){
    removeSelected(); 
    $(".removeSingleNodes").css("display", 'none')

    console.log("clear was called")

    for(var i = nodes.length - 1; i >= 0; i--){
      remove(nodes[i].name)
    }
    restart();
  },
  updateSlider: function(event, ui){
    if(nodes.length != 0){
      if(confirm("Changing the time will reset your nodes. Is this ok?")){
        nodes = []
        links = []
        restart();
        update();
      }
      else{
        $("#slider-vertical a").removeClass("ui-state-focus ui-state-active ui-state-hover")
      }
    }    
    else{
      update();
    }

    function update(){
      var i = (ui.value/100)*main_collection.length
      i = Math.ceil(i)

      var currentModel = main_collection.models[i]
      click(currentModel.get("_id"), currentModel.get("time"))
    }

  },

  // Will toggle if the button has been selected or not
  // If selected, will delect and remove node
  // If not selected, will select, add node, fetch it's connections
  // and add it's connections
  nodeButtonClick: function(e){
    current = $(e.currentTarget)

    console.log("node button was clicked")

    var time_id = current.data("timeid") // get id of current button
    var name = current.data("name") //get current hostname

    //toggle selected
    current.toggleClass('selected');

    //if the node has been selected
    if(current.hasClass('selected') == true){
    	findAddEdges(time_id, name)
    }
    // if the node is not selected
    else{
      remove(name)
      restart();
    };
  },
  appButtonClick: function(e){

    $(".removeSingleNodes").css("display", 'inline')

    current = $(e.currentTarget)
    current.toggleClass('selected');

    applicationName = current.data("name")

    //if the node has been selected
    if(current.hasClass('selected') == true){
      addApp(applicationName, test(applicationName))
    }
    // if the node is not selected
    else{
      removeApp(applicationName, test(applicationName))
      restart();
    };
  },
  setButtonClick: function(e){
    this.clear;

    current = $(e.currentTarget);
    setName = current.data("name");

    var array = new Array();

    serversetCollection.forEach(function(set){
      if(set.get("name") == setName){
        array = set.get("server_ids");
      }
    });

    console.log(array)

    array.forEach(function(app){
      console.log(app)
      var applicationNameArray = applicationCollection.where({app_id: app});

      applicationName = applicationNameArray[0].get("name")
      console.log(applicationName)

      var holder = test(applicationName)

      addApp(applicationName, holder)

    });
  }
});

function test(appName){

    var serverArray;
    var array = new Array();

    applicationCollection.forEach(function(application){
      if(application.get("name") == applicationName){
        serverArray = application.get("server_ids")
      }
    })

    serverArray.forEach(function(d, index){
      var current = nodesCollection.where({server_id: d})
      if(current.length > 0)
        array[index] = current[0].get("hostname");
    })

    return array
}

function click(e, f){
  var collectionID = e;

  nodesCollection = new NodesCollection([], {id: collectionID});
  getNodes = nodesCollection.fetch();

  getNodes.done(function(){

    $('#server-container .list-group li').remove()

    nodesCollection.forEach(function(node){
      $(this.el).append("This is the hostname " + node.get('hostname'));
      $('#server-container .list-group').append("<li><a href='#' class='list-group-item nodeButton' data-name='"
        + node.get('hostname') + "' data-timeid='" + node.get('timemodel_id') + "'>" + node.get('hostname') + "</a></li>");
    });
  
    var currentTime = new Date(1000*f);

    $('.time').text("Time: " + currentTime)
    $('.time').data("time_id" , {first: collectionID})

   });
}

function removeSelected(){
  $(".nodeButton").each(function(){
    if($(this).attr("class")){
      $(this).removeClass("selected")
    }
  })

  $(".appButton").each(function(target){
    if($(this).attr("class")){
      $(this).removeClass("selected")
    }
  })
}

function findAddEdges(time_id, name){
  //Add node
  add(name);

  //fetch it's connections
  var connectedNodesCollection = new ConnectedNodesCollection([],{id: time_id, node_name: name })
  getConnected = connectedNodesCollection.fetch()
  getConnected.done(function(){

  	connectedNodesCollection.forEach(function(edge){

          //add it's connections
          if(edge.get('toID') === name)
          	add(edge.get('fromID'), edge.get('toID'))
          else if(edge.get('fromID') === name)
          	add(edge.get('toID'), edge.get('fromID'))

      });
  });
}

function populateApplications(){
    applicationCollection = new ApplicationCollection();
    getApps = applicationCollection.fetch();

    getApps.done(function(){

      $('#application-container .list-group li').remove()

      applicationCollection.forEach(function(application){
        $('#application-container .list-group').append("<li><a href='#' class='list-group-item appButton' data-name='"+ 
          application.get('name') + "'>" + application.get('name') + "</a></li>");
      });
    });
}

function populateServersets(){
    serversetCollection = new ServersetCollection();
    getSets = serversetCollection.fetch();

    getSets.done(function(){
      serversetCollection.forEach(function(set){
        $('.dropdown-menu').append("<li><a href='#' class='setButton' data-name='" + set.get('name') + "'>" + set.get('name') + "</a></li>");
      });
    });
}

var main_collection = new TimemodelCollection();
var fetch = main_collection.fetch({update: true, merge: false, remove: false, add: true});
var applicationCollection;
var nodesCollection;
var serversetCollection;

var timemodelView1 = new TimemodelView1();

populateApplications();
populateServersets();

$(".application-menu").click(function(){
  $(".server-menu").parent().css("background-color", 'white')
  $(".application-menu").parent().css("background-color", "#D9EDF7")
  $("#server-container").css("display", "none")
  $("#application-container").css("display", "block")
  $(".app-menu-text-box").css("display", "block")
  $(".server-menu-text-box").css("display", "none")
})

$(".server-menu").click(function(){
  $(".server-menu").parent().css("background-color", '#D9EDF7')
  $(".application-menu").parent().css("background-color", "white")
  $("#application-container").css("display", "none")
  $("#server-container").css("display", "block")
  $(".app-menu-text-box").css("display", "none")
  $(".server-menu-text-box").css("display", "block")
})

  $(".server-menu").parent().css("background-color", '#D9EDF7')
  $(".removeSingleNodes").css("display", 'none')


$(function(){
  $('#search_input').fastLiveFilter('#search_list');
  $('#app_search_input').fastLiveFilter('#app_search_list');
})
