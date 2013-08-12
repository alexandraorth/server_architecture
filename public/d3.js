
//HANDLE WINDOW SIZE CHANGE/RESPONSIVENESS

//dynamic heights and widths based on window size
width = $("#container").width()
height = $("#container").width()

d3.select(window)
  .on("resize", sizeChange);

function sizeChange() {
  width = $("#container").width()
  height = $("#container").width()
  d3.layout.force().size([width, height])
}


//BEGIN D3 SETUP

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
    .on("mousemove", mousemove)

var nodes = force.nodes(),
    links = force.links(),
    rect = svg.append('svg:g').selectAll("g"),
    link = svg.append('svg:g').selectAll(".link");

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
  force.stop() // stops the force auto positioning before you start dragging
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
  force.resume();
}

//adds the node and the connection if it does not exist
//if the node exists and the taget exists, adds only the connection
function add(nodeName, connection){
  var bool = new Boolean(); // boolean 
  bool = false

  //test to see if the node exists
  nodes.forEach(function(target) {
    if(target.name == nodeName){
      bool = true
    }
  });

  //if the node does not exist
  if(bool == false){ 
    var node = {x: 500, y: 200, name: nodeName, type: "node"}, //push it to nodes
    n = nodes.push(node);

    addLinks(nodeName, connection); //add any links

    restart();    
  }
  else if(bool == true){ //even if you don't add the node, you want to add new links on that node

    addLinks(nodeName, connection);

    restart();
  };
}

//Test to see if the two nodes exist, if they do, create a link.
function addLinks(toName, fromName){
  var from = null,
    to = null;

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

function addApp(appName, serverArray){
  var toAdd = serverArray.slice(0);

  //mark the nodes that need to be added to complete the application
  for(var i = toAdd.length -1; i >= 0; i--){
  	server = toAdd[i];
  	nodes.forEach(function(target){
      if(server == target.name){
      	toAdd.splice(i,1)          	
      }
      // if(target.type == "app"){
      //   console.log("these are the nodesContained:")
      //   console.log(target.nodesContained)
      //   target.nodesContained.forEach(function(contained){
      //     console.log(contained)
      //     if(server == contained){
      //       console.log("REMOVING")
      //       toAdd.splice(i,1)           
      //     }
      //   });
      // }
    });
  };

  var appNode = {x: 200, y: 200, name: appName, type: "app", nodesContained: serverArray}, //push it to nodes
  an = nodes.push(appNode);

  restart();

  toAdd.forEach(function(d){
   var time_id = $('.time').data("time_id").first

  	findAddEdges(time_id, d)
  });

  setTimeout(function(){
    nodes.forEach(function(target){
      serverArray.forEach(function(server, index){
        if(server == target.name){
          removeOnlyNode(target.name);
        }
      });
    });

    for(var i = links.length -1; i >= 0; i--){
      line = links[i]

      serverArray.forEach(function(server){
        if(line.source.name == server){
          links.push({source: appNode, target: line.target});
          removeLink(line.source.name, line.target.name);           
        }
        else if(line.target.name == server){
          links.push({source: appNode, target: line.source});
          removeLink(line.source.name, line.target.name);
        }
      });
    };
    restart();

  }, 1000);
}

function removeLink(toNode, fromNode){
  for(var i = links.length -1; i >= 0; i--){
    line = links[i]
    if(toNode == line.source.name && fromNode == line.target.name){
      links.splice(i,1);
    }
    else if (toNode == line.target.name && fromNode == line.source.name){
      links.splice(i,1);
    };
  };
}

//removes the node and any links that connect to that node, 
// does not remove connecting nodes.
function remove(nodeName){
  //find the node that you want to remove
  removeOnlyNode(nodeName);

  //Iterate in reverse. This way the indeces do not change
  //as you iterate through and you can see/remove all the links.
  //The indeces will change for the links "behind" the current link,
  //that is, all of the links that you have already checked.
  //This is also the reason a forEach was not used
  for(var i = links.length -1; i >= 0; i--){
    line = links[i]

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

function removeOnlyNode(nodeName){

  nodes.forEach(function(target, index){
    if(target.name == nodeName){
    	nodes.splice(index, 1);
      // swap();

      $(this).addClass("toRemove")
    };
  });

  restart();
}

function removeApp(appName, serverArray){
  remove(appName)

  serverArray.forEach(function(d){
   var time_id = $('.time').data("time_id").first

    findAddEdges(time_id, d)
  });
}


function mousemove() {
  cursor.attr("transform", "translate(" + d3.mouse(this) + ")");
}

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
  .attr("y1", function(d) { return d.source.y; })
  .attr("x2", function(d) { return d.target.x; })
  .attr("y2", function(d) { return d.target.y; });

  rect.attr("transform", function(d) { 
    if (d.type == "app"){
      return "translate(" + Math.max(13, Math.min(width - 13, d.x)) + "," + Math.max(13, Math.min(height - 13, d.y)) + ")"
    }
    else if(d.type == "node"){
      return "translate(" + Math.max(8, Math.min(width - 8, d.x)) + "," + Math.max(8, Math.min(height - 8, d.y)) + ")"
    }
  });
}


//handle highlighting of nodes, links, and neighbors
function mouseover(){
  d3.select(this).select("circle").attr("stroke", "#9ecae1").attr("stroke-width", "2")

  holder = this;
  $('.link').each(function(line){
    if($(holder).attr("transform").split(/\((.*?)\)/g)[1].split(",")[0] == $(this).attr("x1") ){
      $(this).css("stroke-width", "3")
      cons;ole.log(line.source)

    }
    else if( $(holder).attr("transform").split(/\((.*?)\)/g)[1].split(",")[0] == $(this).attr("x2")){
      $(this).css("stroke-width", "3")
    }
  });
}

// handle de-highlighting of nodes, links and neighbors
function mouseout(){
  d3.select(this).select("circle").attr("stroke", "black").attr("stroke-width", "1")

  holder = this;
  $('.link').each(function(line){
    if($(holder).attr("transform").split(/\((.*?)\)/g)[1].split(",")[0] == $(this).attr("x1")){
          $(this).css("stroke-width", "1");
    }
    else if( $(holder).attr("transform").split(/\((.*?)\)/g)[1].split(",")[0] == $(this).attr("x2")){
      $(this).css("stroke-width", "1")
    }
  });
}

function restart() {
  link = link.data(links);

  link.exit().remove();

  link.enter().insert("line", ".node").attr("class", "link");

  rect = rect.data(nodes, function(d){return d.name})

  rect.exit().remove();

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
      return target.name;
    })
  }
  else if(nodes[nodes.length -1].type == "app"){

    var g = rect.enter().append('svg:g');

    g.attr("class", "node")
    .call(node_drag)
    .on("mouseover", mouseover)
    .on("mouseout", mouseout);

    g.append("svg:circle", ".cursor")
    .attr("r", 13)
    .attr("fill", "#D9EDF7");

    g.append("svg:text")
    .attr("x", 10)
    .attr("dy", ".31em")
    .text(function(target){
      return target.name;
    })

  }
  force.start();
}

