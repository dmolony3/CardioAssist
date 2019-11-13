var modal = document.getElementById("myModal");
var numberOfSuggestions = $('tr').length;
var tableOpened = 0;
var rowIndex = 0;
var highlightedText


var margin = {top: 50, right: 50, bottom: 50, left: 50},
  width = 300 - margin.left - margin.right,
  height = 300 - margin.top - margin.bottom;

var myColor = d3.scaleSequential()
    .interpolator(d3.interpolateMagma)
    .domain([0,1])

function createHeatmap(data) {
// append the svg object to the body of the page
 
//labels 
var tickNames = [...new Set(data.map(a => a.text1))];
// Build X scales and axis: // the domain gets  mapped to the range
var x = d3.scaleBand()
  .range([ 0, width ])
  .domain(tickNames)
  .padding(0.01);
var xAxis = d3.axisBottom()
  .scale(x);
  
svg.append("g").attr('class','x axis')
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis)
  .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-90)");
  
// Build Y scales and axis:
var y = d3.scaleBand()
  .range([ height, 0 ])
  .domain(tickNames)
  .padding(0.01);
var yAxis = d3.axisLeft()
  .scale(y);
  
svg.append("g").attr('class','y axis')
  .call(yAxis);

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    return "<span style='color:red'>" + d.attentionValue.toFixed(2) + "</span>";
  })
svg.call(tip);
  
  var myColor = d3.scaleSequential()
    .interpolator(d3.interpolateMagma)
    .domain([0,1])

  svg.selectAll()
      .data(data)
      .enter()
      .append("rect")
      .attr("x", function(d) { return x(d.text1) })
      .attr("y", function(d) { return y(d.text2) })
      .attr("width", x.bandwidth() )
      .attr("height", y.bandwidth() )
      .style("fill", function(d) { return myColor(d.attentionValue)} )
      .on("mouseover", tip.show)
	  .on("mouseout", tip.hide)
}

var svg = d3.select(".attention")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

function updateAxis(text) {
	x.domain(text);
	//xaxis.scale = x;
	svg.select('.x.axis')
	.transition().duration(1000)
	.call(xAxis);
	y.domain(text);
	svg.select('.y.axis')
	.transition().duration(1000)
	.call(yAxis)
}

var layerMenu = d3.select("#layerDropdown");
var numLayers = $("#numLayers").val();
layers = Array.from({ length: parseInt(numLayers) }, (_, k) => `Layer${k+1}`);

layerMenu
  .append("select")
  .attr("id", "layerMenu")
  .selectAll("option")
	.data(layers)
	.enter()
	.append("option")
	.attr("value", function(d, i) { return i; })
	.text(function(d) { return d; });

var headMenu = d3.select("#headDropdown");
var numHeads = $("#numHeads").val();
heads = Array.from({ length: parseInt(numHeads) }, (_, k) => `Head${k+1}`);

headMenu
  .append("select")
  .attr("id", "headMenu")
  .selectAll("option")
	.data(heads)
	.enter()
	.append("option")
	.attr("value", function(d, i) { return i; })
	.text(function(d) { return d; });

$('#layerMenu').change(function() {
	var selectedHead = parseInt($('#headMenu').val())
	var selectedLayer = parseInt($(this).val())
    //currentHeadIndex = +selectedHead;
	alert(highlightedText)
	$.ajax({
	type: 'POST',
	url: 'plot_attention',
	data: JSON.stringify({"text": highlightedText, "head": selectedHead, "layer": selectedLayer}),
	dataType: 'json',
	contentType: 'application/json; charset=utf-8',
	success: function(data) {
		var updateHeatmap = function(data) {
		    var heatmap = svg.selectAll('rect')
			  .data(data)
			  .transition()
			  .duration(500)
			  .style("fill", function(d) { return myColor(d.attentionValue)} )
	}
		updateHeatmap(data);		  
	}
	});
});

$('#headMenu').change(function() {
	var selectedHead = parseInt($(this).val())
	var selectedLayer = parseInt($('#layerMenu').val())
    //currentHeadIndex = +selectedHead;
	alert(highlightedText)
	$.ajax({
	type: 'POST',
	url: 'plot_attention',
	data: JSON.stringify({"text": highlightedText, "head": selectedHead, "layer": selectedLayer}),
	dataType: 'json',
	contentType: 'application/json; charset=utf-8',
	success: function(data) {
		var updateHeatmap = function(data) {
		// filter data to return object of location of interest
		// update the data and redraw heatmap
		/*
			var heatmap = svg.selectAll(".attentionValue")
			  .data(data)
			  .transition()
			  .duration(500)
			  .style("fill", function(d) { return myColor(d.attentionValue)})
		  }*/
		    var heatmap = svg.selectAll('rect')
			  .data(data)
			  .transition()
			  .duration(500)
			  .style("fill", function(d) { return myColor(d.attentionValue)} )
			//heatmap.exit().remove();
			console.log(data[1]['attentionValue'])
			//var heatmap = svg.selectAll('rect')
			//  .style("fill", 'red')
	}
		updateHeatmap(data);		  
	}
	});
});

$("#addBtn").click(function() {
	selectedHead = parseInt($('#headMenu').val())
	selectedLayer = parseInt($('#layerMenu').val())
	$("#tooltip").hide();
  	$.ajax({type: 'POST',
		  url: 'plot_attention',
		  data: JSON.stringify({"text": selection, "head": selectedHead, "layer": selectedLayer}),
		  dataType: 'json',
		  contentType: 'application/json; charset=utf-8',
          success: function (data) {
			var numberOfTokens = data.length;
			svg.selectAll("*").remove();
			createHeatmap(data);
		  }
		  });
});
		
function placeTooltip(x_pos, y_pos) {
  $("#tooltip").css({
    top: y_pos + 'px',
    left: x_pos + 'px',
    position: 'absolute'
  });
}
	  
$(document).mouseup(function(e) {  
   // get selected text
  // http://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
  selection = window.getSelection().toString();
  if (selection.length > 0) {
  if (e.target.id === 'textBox') {
  $('#selTxt').val(selection.toString());
	highlightedText = selection;
    var x = e.pageX;
    var y = e.pageY;  
    placeTooltip(x, y);
    $("#tooltip").show();
  }
  }
  else {
	$("#tooltip").hide() 
 }
  });
  
$(document).keydown(function (e) {
	if (tableOpened === 1) {
    switch(e.which) 
    {
        case 38: //up
            --rowIndex
            if (rowIndex < 0) {
          		  rowIndex = $('tr').length -1
            }
            highlight(rowIndex);
            break;
        case 40:  //down
            ++rowIndex
        		if (rowIndex+1 > $('tr').length) {
           		 rowIndex = 0;
            }
            highlight(rowIndex);
            break;
      	case 13: //return
            e.preventDefault()
            selectedText = $('tr')[rowIndex].innerText;
            currentText = $('#textBox').text();
            $('#textBox').text(currentText + selectedText);
            tableOpened = 0;
            rowIndex = 0;
            modal.style.display = "none";
            document.getElementById("textBox").focus();
            placeCaretAtEnd(document.getElementById("textBox"));
            break;
      	case 27: //escape
            tableOpened = 0;
            rowIndex = 0;
            modal.style.display = "none";
            document.getElementById("textBox").focus();
            placeCaretAtEnd(document.getElementById("textBox"));
            break;
    }
    }
 });
 
(function() {

var tabKeyPressed = false;

$("#textBox").keydown(function(e) {
   tabKeyPressed = e.keyCode == 9;
   if (tabKeyPressed) {
      e.preventDefault();
      return;
   }
});

$("#textBox").keyup(function(e) {
    //var initialText = {"text": $(this).val()};
    var initialText = $('.initialText').text();
    var temperature = $('#slider-temp').val();
    var top_k = $('#slider-top-k').val();
    var num_responses = $('#num-responses').val();
	var modal = document.getElementById("myModal");
    if (tabKeyPressed) {
		$('#textBox').addClass('spinner');
		var initialText = $('.textarea').text();
	    alert(initialText);
		$.ajax({
		  type: 'POST',
		  url: 'process1',
		  data: JSON.stringify({"text": initialText, "temperature": temperature, "top-k": top_k, "num-responses": num_responses}),
		  dataType: 'json',
		  contentType: 'application/json; charset=utf-8',
          success: function (data) 
		{
			$('#textBox').removeClass('spinner');
			var currentTableLength = document.getElementById('table-data').getElementsByTagName('tr').length;
			while (currentTableLength != num_responses) {
				if (currentTableLength > num_responses) {
					document.getElementById("table-data").deleteRow(currentTableLength - 1);					
				}
				else if (currentTableLength < num_responses){
					$('#table-data').append("<tr><td>NewText</td></tr>");
				}
				currentTableLength = document.getElementById('table-data').getElementsByTagName('tr').length;
			}
			for (row = 0; row < num_responses; row++) 
			{
				$('tr')[row].innerText = data[row]['text']
			}
			var positionTop = document.getElementById("textBox").offsetTop;
			var positionLeft = document.getElementById("textBox").offsetLeft;
			var caretPos = getCaretPosition(positionLeft, positionTop);
			modal.style.display = "block";
			$('.modal-content').offset({ top: caretPos.y, left: caretPos.x + 5});
			highlight(0);
			tableOpened = 1;
     		//$('.textarea').text(initialText + data['text']);
			//$('.initialText').text(initialText);
			//$('.newText').text(data['text']);
			//placeCaretAtEnd( document.querySelector('.textarea') );
        }
	    });
		
        e.preventDefault();
        return;
    }

});
})();

function charcountupdate(str) {
	var lng = str.length;
	document.getElementById("charcount").innerHTML = lng + ' characters';
}


function displayModal(){
  modal.style.display = "block";
}

function highlight(tableIndex) {
    // Just a simple check. If .highlight has reached the last, start again
    if( (tableIndex+1) > $('#table-data tr').length )
        tableIndex = 0;

    // Element exists?
    if($('#table-data tr:eq('+tableIndex+')').length > 0)
    {
        // Remove other highlights
        $('#table-data tr').removeClass('highlight');

        // Highlight your target
        $('#table-data tr:eq('+tableIndex+')').addClass('highlight');
    }
}

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}

function getCaretPosition(x, y) {

    var sel = window.getSelection();
    if(sel.rangeCount) {
        var range = sel.getRangeAt(0).cloneRange();
        if(range.getClientRects()) {
        range.collapse(true);
        var rect = range.getClientRects()[0];
        if(rect) {
            y = rect.top;
            x = rect.left;
        }
        }
    }
    return {
        x: x,
        y: y
    };
}

function tweetIt () {
	var phrase = document.getElementById('textBox').innerText;
	var tweetUrl = 'https://twitter.com/share?hashtags=CardioAssist' +
	'&text=' +
    encodeURIComponent(phrase) +
    '.' +
    'AI text generated by ' +
    '&url=' +
	'http://CardioAssist.com/' +
	'&via=DavidSMolony';
    
	window.open(tweetUrl);
}

$('[data-toggle="popover"]').popover();
