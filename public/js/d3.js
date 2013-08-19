// ==========================
//HANDLE WINDOW SIZE CHANGE/RESPONSIVENESS
// ==========================


//dynamic heights and widths based on window size
width = $("#container").width();
height = $("#container").width();

d3.select(window)
  .on("resize", sizeChange);

function sizeChange() {
  width = $("#container").width();
  height = $("#container").width();
  d3.layout.force().size([width, height]);
}

// ==========================
// BEGIN D3 SETUP
// ==========================

var fill = d3.scale.category20();

var force = d3.layout.force()
    .size([width/2, height/2])
    .nodes([]) // initialize with a single node
    .linkDistance(200)
    .charge(-90)
    .on("tick", tick)
    .gravity(.03);

var svg = d3.select("#container")
    .append("svg")
    .append("g")
    .attr("class", "svg-container")
    .on("mousemove", mousemove);

var nodes = force.nodes(),
    links = force.links(),
    link = svg.append('svg:g').selectAll(".link"),
    rect = svg.append('svg:g').selectAll("g");

var cursor = svg.append("circle")
    .attr("r", 30)
    .attr("transform", "translate(-100,-100)")
    .attr("class", "cursor");

var node_drag = d3.behavior.drag()
    .on("dragstart", dragstart)
    .on("drag", dragmove)
    .on("dragend", dragend);        

//following three functions dragstart, dragmove and dragend
// will allow nodes to be "held" in place when you click them
function dragstart(d, i) {
  force.stop(); // stops the force auto positioning before you start dragging
}

function dragmove(d, i) {
    d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x += d3.event.dx;
    d.y += d3.event.dy; 
    tick(); // this is the key to make it work together with updating both px,py,x,y on d !
}

function dragend(d, i) {
  d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
  tick();
  if(frozen == false)
    force.resume();
}

// ==========================
//ADDING APPLICATIONS/NODES
// ==========================

//adds the node and the connection if it does not exist
//if the node exists and the taget exists, adds only the connection
function add(nodeName, connection){
  var bool = new Boolean(); // boolean 
  bool = false;

  //test to see if the node exists as a server or within an application
  nodes.forEach(function(target) {
      if(target.name == nodeName){
        bool = true;
      };
    });

  //if the node does not exist
  if(bool == false){ 
    var node = {x: 500, y: 200, name: nodeName, type: "node"}, //push it to nodes
    n = nodes.push(node);

    nodes.forEach(function(target){
      if(target.type == "app") {
        var arrayAsString = target.nodesContained.join();

        console.log(arrayAsString)
        console.log(nodeName)

        if(arrayAsString.indexOf(nodeName) > -1){
          addLinks(target.name, nodeName);
        };
      };
    })

    addLinks(nodeName, connection); //add any links

    restart();    
  }
  else if(bool == true){ //even if you don't add the node, you want to add new links on that nodex
    addLinks(nodeName, connection);
    restart();
  };
}

//Test to see if the two nodes exist, if they do, create a link.
function addLinks(toName, fromName){
  var from = null,
    to = null;

  var bool = new Boolean(); // boolean 
  bool = false;

  //test to see if the node exists as a server or within an application
  links.forEach(function(line) {
    if(line.target.name == toName && line.source.name == fromName ||
      line.target.name == fromName && line.source.name == toName){
      bool = true;
    }
  });

  if(bool == false){
    nodes.forEach(function(target){
      if (target.name == toName){
        to = target;
      }
      else if(target.name == fromName){
        from = target;
      };
    });

    if(from != null && to != null){
      links.push({source: from, target: to});
    };
  }
}

function addApp(appName, serverArray, set){
  $(".removeSingleNodes").css("display", 'inline');

  //push the application node to the view
  var appNode = {x: 200, y: 200, name: appName, type: "app", nodesContained: serverArray, set: set};
  nodes.push(appNode);
  restart();

  var toAdd = serverArray.slice(0);

  //mark the nodes that need to be added to "complete" the application
  for(var i = toAdd.length -1; i >= 0; i--){
    //go through all the servers that exist
  	server = toAdd[i];
  	nodes.forEach(function(target){
      //if that server exists, remove it from "toAdd" as it does not need to be added to the view
      if(server == target.name){
      	toAdd.splice(i,1);
      }
    });
  };

  //add all of the nodes in this application that are not in the view
  toAdd.forEach(function(d){
    var time_id = $('.time').data("time_id").first;
  	findAddEdges(time_id, d);
  });

  //Timeout so that links are not added before all nodes exist
  setTimeout(function(){
    //Remove all of the server nodes in the application to make room for the application node
    serverArray.forEach(function(server, index){
      nodes.forEach(function(target){
        if(server == target.name){
          removeNode(target.name);
        };

        if (target.type == "app") {
          var arrayAsString = target.nodesContained.join();

          if(arrayAsString.indexOf(server) > -1){
            addLinks(target.name, appName);
          }
        };
      });

      for(var i = links.length -1; i >= 0; i--){
        line = links[i];

        if(line != null && line.source.name == server){
          links.splice(i,1)
          addLinks(appNode.name, line.target.name);
        }
        else if(line != null && line.target.name == server){
          links.splice(i,1)
          addLinks(appNode.name, line.source.name);
        };
      };
    });
    restart();

  }, 1000);
}

function removeLink(toNode, fromNode){
  //Iterate in reverse
  for(var i = links.length -1; i >= 0; i--){
    line = links[i];
    if(toNode == line.source.name && fromNode == line.target.name){
      links.splice(i,1);
    }
    else if (toNode == line.target.name && fromNode == line.source.name){
      links.splice(i,1);
    };
  };
}


// ==========================
//REMOVING APPLICATIONS/NODES
// ==========================

//removes the node and any links that connect to that node, 
// does not remove connecting nodes.
function remove(nodeName){
  //find the node that you want to remove
  removeNode(nodeName);

  //Iterate in reverse. This way the indeces do not change
  //as you iterate through and you can see/remove all the links.
  //The indeces will change for the links "behind" the current link,
  //that is, all of the links that you have already checked.
  //This is also the reason a forEach was not used
  for(var i = links.length -1; i >= 0; i--){
    line = links[i];

    if(line.source.name == nodeName){
      links.splice(i, 1);
    }
    else if(line.target.name == nodeName){
      links.splice(i, 1);
    }
  }
  //redraw the nodes
  // restart();
}

function removeNode(nodeName){

  var appPresent = new Boolean();
  appPresent = false;

  nodes.forEach(function(target, index){
    if(target.name == nodeName){
    	nodes.splice(index, 1);
    }
    else if(target.type == "app"){
      appPresent = true;
    }
  });

  if(appPresent == false){
    $(".removeSingleNodes").css("display", 'none');
  }

  restart();
}

function removeApp(appName, serverArray){
  remove(appName);
  $.each(serverArray, function(index, d){
   var time_id = $('.time').data("time_id").first;

    findAddEdges(time_id, d);
  });
}

// ==========================
//NODE MOVEMENT/VIEW
// ==========================

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
  .attr("y1", function(d) { return d.source.y; })
  .attr("x2", function(d) { return d.target.x; })
  .attr("y2", function(d) { return d.target.y; });

  rect.attr("transform", function(d) { 
    if (d.type == "app"){
      return "translate(" + Math.max(11, Math.min(width - 11, d.x)) + "," + Math.max(11, Math.min(height - 11, d.y)) + ")";
    }
    else if(d.type == "node"){
      return "translate(" + Math.max(8, Math.min(width - 8, d.x)) + "," + Math.max(8, Math.min(height - 8, d.y)) + ")";
    }
  });
}

//handle movement of nodes
function mousemove() {
  cursor.attr("transform", "translate(" + d3.mouse(this) + ")");
}

//handle highlighting of nodes, links, and neighbors
function mouseover(d){
  if($(this).children()[0].r.animVal.value > 8){
    $('.contained_servers_box').text(d.nodesContained.join().replace(/,/g, '\n'));
  }

  //fade out everything else
  $('.node').each(function(node){
    d3.select(this).select("circle").attr("opacity", ".6");
    d3.select(this).select("text").attr("opacity", ".3");
  })
  $('.link').each(function(line){
    $(this).css("opacity", ".3");
  });

  //make current node and links more prominent
  d3.select(this).select("circle").attr("stroke", "#4ACFFF").attr("stroke-width", 2).attr("opacity", "1");
  d3.select(this).select("text").attr("opacity", "1");

  server_name = $(this).children().text();
  var toHighlight = new Array();
  //highlight links
  holder = this;
  $('.link').each(function(line){
    if($(holder).attr("transform").split(/\((.*?)\)/g)[1].split(",")[0] == $(this).attr("x1") 
      || $(holder).attr("transform").split(/\((.*?)\)/g)[1].split(",")[0] == $(this).attr("x2")){
      $(this).css("opacity", "1");
      $(this).css("stroke-width", "2").css("stroke", "#4ACFFF").css("opacity", .8);
      toHighlight.push($(this).attr('class'))
    };
  });

  toHighlight = toHighlight.join()
  $('.node').each(function(){
    if(toHighlight.indexOf($(this).children().text().split(/\(.*?\)/)[0]) > -1){
      d3.select(this).select("circle").attr("stroke", "#4ACFFF").attr("stroke-width", 2).attr("opacity", "1");
      d3.select(this).select("text").attr("opacity", "1");
    };
  });
}

// handle de-highlighting of nodes, links and neighbors
function mouseout(){
  $('.contained_servers_box').empty();
  $('.node').each(function(node){
    d3.select(this).select("circle").attr("stroke", "black").attr("stroke-width", "1").attr("opacity", "1");
    d3.select(this).select("text").attr("opacity", "1");
  })
  $('.link').each(function(line){
    $(this).css("opacity", "1");
    $(this).css("stroke-width", "1").css("stroke", "#9ecae1").css("opacity", 1);
  });
}

function restart() {
  link = link.data(links);

  link.exit().remove();

  link.enter().insert("line", ".node").attr("class", function(line){
    return line.source.name.split(/\(.*?\)/)[0] + " link " + line.target.name.split(/\(.*?\)/)[0];
  });

  rect = rect.data(nodes, function(d){return d.name});

  rect.exit().remove();

  //if adding a node, format it as a node
  if(nodes[nodes.length -1].type == "node"){ 

    var g = rect.enter().append('svg:g');

    g.attr("class", "node")
    .call(node_drag)
    .on("mouseover", mouseover)
    .on("mouseout", mouseout);

    g.append("svg:circle", ".cursor")
    .attr("r", 8)
    .attr("fill", "#7DBF3B");

    g.append("svg:text")
    .attr("x", 10)
    .attr("dy", ".31em")
    .text(function(target){
      // return (target.name).replace(/\s/);
      return target.name
    })
  }

  //if adding an application, format it as an application
  else if(nodes[nodes.length -1].type == "app"){
    var g = rect.enter().append('svg:g');

    g.attr("class", "node")
    .call(node_drag)
    .on("mouseover", mouseover)
    .on("mouseout", mouseout);

    g.append("svg:circle", ".cursor")
    .attr("r", 11)
    .attr("fill", function(d){
      if(d.set == 'Production.Backend.Hbase'){
        console.log("went into red")
        return "red";
      }
      else if(d.set == 'Production.Backend.Hadoop'){
        console.log("went into blue")
        return "blue";
      }
      else {
        console.log("went into null")
        return "#D9EDF7";
      }
    });

    g.append("svg:text")
    .attr("x", 10)
    .attr("dy", ".31em")
    .text(function(target){
      // return (target.name).replace(/ /g, '')
      return target.name.split(/\(.*?\)/)[0];
    });

  };
  force.start();
}

