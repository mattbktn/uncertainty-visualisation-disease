// layout attributes
const PeopleTreeLayout = {

    depthFactor: 180,
    strokeWidth: 1,

    // Text
    fontSize: 12,
    lineHeight: 1.1,
    textWidth: 85,

    // Colours
    textColour: "black"
};

// FontAwesome icons for people
const PeopleIcons = {
    "male": "\uf183",
    "boy": "\uf183",
    "female": "\uf182",
    "girl": "\uf182"
}

// Colors for different states
const PeopleStateColors = {
    "susceptible": "#6b9dcf", //"lightblue",
    "symptomatic": "grey",
    "infected": "#E24646", //"brown",
    "hospitalised": "orange",
    "recovered": "lightgreen",
    "dead": "red",
    "removed": "#466DE2", //"blue",
    "default": "#F9E861" //"yellow"
}

// Icon sizes according to person
const PeopleAgeSize = {
    "child": 80,
    "adult": 120,
    "elderly": 100,
    "default": 120
}

document.getElementById('file-input')
            .addEventListener('change', readSingleFile, false);

function readSingleFile(e) {
    
    var file = e.target.files[0];
    if (file.name.endsWith('.csv')) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var csvData = e.target.result;
            var jsonData = convertCsvToJson(csvData);
            showPeopleTree(jsonData);
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.json')) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var data = JSON.parse(e.target.result);
            var jsonData = [];
            jsonData.push(data);
            
            showPeopleTree(jsonData);
        };
        reader.readAsText(file);
    } else {
        alert("Invalid file type - must be csv or json");
    }
}

function parseCSV(str) {
    var arr = [];
    var quote = false;  // true means we're inside a quoted field

    // iterate over each character, keep track of current row and column (of the returned array)
    for (var row = col = c = 0; c < str.length; c++) {
        var cc = str[c], nc = str[c+1];        // current character, next character
        arr[row] = arr[row] || [];             // create a new row if necessary
        arr[row][col] = arr[row][col] || '';   // create a new column (start with empty string) if necessary

        // If the current character is a quotation mark, and we're inside a
        // quoted field, and the next character is also a quotation mark,
        // add a quotation mark to the current column and skip the next character
        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }  

        // If it's just one quotation mark, begin/end quoted field
        if (cc == '"') { quote = !quote; continue; }

        // If it's a comma and we're not in a quoted field, move on to the next column
        if (cc == ',' && !quote) { ++col; continue; }

        // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
        // and move on to the next row and move to column 0 of that new row
        if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }

        // If it's a newline (LF or CR) and we're not in a quoted field,
        // move on to the next row and move to column 0 of that new row
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }
        if (cc == '\r' && !quote) { ++row; col = 0; continue; }

        // Otherwise, append the current character to the current column
        arr[row][col] += cc;
    }
    return arr;
}

function convertCsvToJson(csvData) {
    var csv = parseCSV(csvData);

    var jsonData = [];
    
    var index  = 1;
    var run = 1
    while (index < csv.length) {
        var runData = {};
        runData.nonIntervention = [];
        runData.intervention = [];
        while (index < csv.length && csv[index][11] == run) {
            var dayNonIntervention = getDayData(csv, index, 5);
            var dayIntervention = getDayData(csv, index, 8);

            runData.nonIntervention.push(dayNonIntervention)
            runData.intervention.push(dayIntervention)
            ++index;
        }
        jsonData.push(runData);
        ++run;
    }

    return jsonData;
}

function getDayData(csv, dayIndex, startIndex) {
    var day = {};
    day.name = 'day' + day;
    day.children = []

    var dayData = getNode('Total Population', 'default', csv[dayIndex][1]);
    dayData.children = []

    var susceptibleData = getNode('Susceptible', 'susceptible', csv[dayIndex][2]);
    dayData.children.push(susceptibleData);

    var infected = getNode('Infected', 'infected', csv[dayIndex][3]);
    dayData.children.push(infected);

    var removedTotal = getNode('Removed', 'removed', csv[dayIndex][4]);
    dayData.children.push(removedTotal);
    removedTotal.children = []

    var recovered = getNode('Recovered', 'recovered', csv[dayIndex][startIndex]);
    removedTotal.children.push(recovered);

    var symptoms = getNode('Symptomatic', 'hospitalised', csv[dayIndex][startIndex+1]);
    removedTotal.children.push(symptoms);

    var dead = getNode('Died', 'dead', csv[dayIndex][startIndex+2]);
    removedTotal.children.push(dead);

    day.children.push(dayData);

    return day
}

function getNode(text, type, value) {
    var node = {};

    node.name = text;
    node.state = type;
    node.type = 'male';
    node.age = 'default';
    node.number = value;

    return node;
}

var daySlider = null;
var runSlider = null;

function replaceElement(name) {
    var oldInput = document.getElementById(name);
    var newInput = document.createElement("input");
    newInput.setAttribute('id', name);
    newInput.setAttribute('data-slider-id', 'ex1Slider');
    oldInput.parentNode.replaceChild(newInput, oldInput);
}

function showPeopleTree(data) {

    document.getElementById("treeTitleNoIntervention").style.visibility = "visible";
    document.getElementById("treeTitleIntervention").style.visibility=  "visible";

    // d3 transition duration
    var duration = 0;
    var fadeDuration = 500;
    var day = 0;
    var run = 0;
    var width = 1200/2;
    var height = 800;
    var maxDays = Math.max(data[run].nonIntervention.length, data[run].intervention.length);
    var maxRuns = data.length;

    var numberTicks = Math.min(20, maxDays);
    var tickStep = Math.round(maxDays / numberTicks);

    var ticks = [];
    var tickLabels = [];
    var i = 0;
    for ( ; i <= numberTicks; ++i) {
        var d = i * tickStep;
        if (maxDays <= d) {
            d = maxDays - 1;
        }
        ticks.push(d)
        tickLabels.push(d.toString())
    }

    if (daySlider) {
        daySlider.destroy();
        replaceElement('daySlider')
    }
    
    daySlider = new Slider('#daySlider', {
        value: 0,
        step: 1,
        ticks: ticks,
        ticks_labels: tickLabels,
        formatter: function(value) {
            return 'Day ' + value;
        }
    });

    var numberRunTicks = Math.min(20, maxRuns);
    var tickStepRun = Math.round(maxRuns / numberRunTicks);

    var runTicks = [];
    var runTickLabels = [];
    i = 0;
    for ( ; i <= numberRunTicks; ++i) {
        var d = i * tickStepRun;
        if (maxRuns <= d) {
            d = maxRuns - 1;
        }
        runTicks.push(d)
        runTickLabels.push(d.toString())
    }

    if (runSlider) {
        runSlider.destroy();
        replaceElement('runSlider')
    }

    runSlider = new Slider('#runSlider', {
        value: 0,
        step: 1,
        ticks: runTicks,
        ticks_labels: runTickLabels,
        formatter: function(value) {
            return 'Run ' + value;
        }
    });

    var stateIntervention = {
        root: null,
        treemap: null,
        svg: null
    }
    // Tree properties
    var propsIntervention = {
        name: 'intervention',
        peopleData: data
    }

    var stateNonIntervention = {
        root: null,
        treemap: null,
        svg: null
    }
    // Tree properties
    var propsNonIntervention = {
        name: 'nonIntervention',
        peopleData: data
    }

    daySlider.on('slide', function (d) {
        console.log('stop')
        day = d;
        loadOutput(stateNonIntervention, propsNonIntervention);
        loadOutput(stateIntervention, propsIntervention);
    });

    runSlider.on('slide', function (d) {
        console.log('stop')
        run = d;
        loadOutput(stateNonIntervention, propsNonIntervention);
        loadOutput(stateIntervention, propsIntervention);
    });

    // Initial draw
    draw(stateNonIntervention, propsNonIntervention);
    draw(stateIntervention, propsIntervention);

    /**
     * Main draw function
     */
    function draw (state, props) {

        var styleWidth = '120%';
        var styleHeight = height + 'px';

        var marginH = 90;
        var marginW = 0

            // Initialise the svg with the given class name
        state.svg = d3.select( '#' + props.name ).append( "svg" )
                .attr( "class", props.name )
                .attr( "width", styleWidth )
                .attr( "height", styleHeight )
                .append( "g" )
                .attr( "transform", "translate(" + marginW + "," + marginH + ")" );

        // Select the day node by class name
        state.svg = d3.select( '.' + props.name );
        
        loadOutput(state, props);
    }


    /**
     * Loads the output people data to initialise the d3 tree
     */
    function loadOutput (state, props) {

        var peopleData = (props.name == 'intervention') ? props.peopleData[run].intervention : props.peopleData[run].nonIntervention;

        // If we have days for more than the data then just display the last day
        var d = Math.min(peopleData.length - 1, day)

        // Assigns parent, children, height, depth - just doing single output for now
        state.root = d3.hierarchy( peopleData[d] );

        state.root.x0 = width / 2;
        state.root.y0 = 90;

        // Invokes the tree
        state.treemap = d3.tree().size( [width, height] ); 

        state.svg.selectAll( '*' ).remove();

        // Main update method
        update( state.root, state );
    }

    /**
     * Get the text for the given node. Currently just gets the name.
     * @param {Object} node The node to get the text for.
     * @return {string} Text for the given node
     */
    function getText ( node ) {
        var maxChar = ( PeopleTreeLayout.textWidth / PeopleTreeLayout.fontSize );

        var text = node.name;

        // Placeholder if we want to not display text for certain nodes
        if ( node.node_id == "dummy_node" ) {
            return "";
        } else {
            return text;
        }
    }

    /**
     * Wraps the text limiting lines to the given width.
     * @param {string} text The text to wrap.
     * @param {number} width The max width of wrapped text lines.
     * @return {string} The wrapped text
     */
    function wrap ( text, width ) {
        text.each( function() {
            var text = d3.select( this ),
                words = text.text().split( /\s+/ ).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = PeopleTreeLayout.lineHeight, // ems
                x = text.attr( "x" ),
                y = text.attr( "y" ),
                dy = 0, 
                tspan = text.text( null )
                    .append( "tspan" )
                    .attr( "x", x )
                    .attr( "y", y )
                    .attr( "dy", dy + "em" );
            while ( word = words.pop() ) {
                line.push( word );
                tspan.text( line.join( " " ) );
                var n = tspan.node();
                if ( tspan.node().getComputedTextLength() > width ) {
                    line.pop();
                    tspan.text( line.join( " " ) );
                    line = [word];
                    tspan = text.append( "tspan" )
                        .attr( "x", x )
                        .attr( "y", y )
                        .attr( "dy", ++lineNumber * lineHeight + dy + "em" )
                        .text( word );
                }
            }
        } );
    }

    /**
     * Get the size to render the person icon.
     * @param {string} age The age of the person (child, adult, elderly or default)
     * @return {number} Font size for icon rendering size
     */
    function getPersonSize ( age ) {
        if ( age in PeopleAgeSize ) {
            return PeopleAgeSize[age];
        }
        return PeopleAgeSize["default"];
    }

    /**
     * Get the person icon state color to render.
     * @param {string} state The state to render the person as (susceptible, symptomatic, infected, recovered, dead or default)
     * @return {string} The color to render
     */
    function getPersonState ( state ) {
        if ( state in PeopleStateColors ) {
            return PeopleStateColors[state];
        }
        return PeopleStateColors["default"];
    }

    /**
    * Looks up the icon for the named node or the default icon if not found
    * @param {string} name - name of the people icon (male, boy, female, girl)
    * @return The unicode of the FontAwesome icon to render
    */
    function getIcon ( name ) {
        if ( name in PeopleIcons ) {
            //console.log( "Icon: " + PeopleIcons[name] )
            return PeopleIcons[name];
        }
        return PeopleIcons["default"];
    }

    function update ( source, state ) {

        // Assigns the x and y position for the nodes
        var treeData = state.treemap(state.root);

        // Compute the new tree layout.
        var rootNode = treeData.descendants()[0];
        var nodes = treeData.descendants().slice( 1 ),
            links = treeData.descendants().slice( rootNode.children.length + 1 );

        var depthFactor = PeopleTreeLayout.depthFactor;

        // Normalize for fixed-depth.
        nodes.forEach( function( d ) {
            //console.log( d );
            d.y = ( d.depth - 1 ) * depthFactor + ( depthFactor / 2 );
        } );

    // ****************** Nodes section ***************************

        var i = 0;
        // Update the nodes...
        var node = state.svg.selectAll( '#node' )
            .data( nodes, function( d ) {
                //console.log(d);
                return d.id || ( d.id = ++i );
            } );

        // Enter any new modes at the parent's previous position.
        var nodeEnter = node.enter().append( 'g' )
            .attr( 'id', 'node' )
            .attr( "transform", function( d ) {
                console.log('transform: ' + source.x0 + "," + source.y0)
                return "translate(" + source.x0 + "," + source.y0 + ")";
            } );

        // Add people icon for the nodes
        nodeEnter.append( "text" )
            .style( 'fill-opacity', 0.35 )
            .style( 'opacity',function( d ) {
                return d.data.number > 0 ? 1.0 : 0.2;
            }.bind( this ) )
            .style( 'stroke', "black" )
            .style( 'stroke-width', PeopleTreeLayout.strokeWidth )
            .style( "fill", function( d ) {
                return getPersonState( d.data.state );
            }.bind( this ) )
            .attr( 'font-size', function( d ) {
                return getPersonSize( d.data.age );
            }.bind( this ) )
            .attr( 'cursor', 'pointer' )
            .attr( 'class', 'people_icon' )
            .attr( 'text-anchor', 'middle' )
            .attr( 'dominant-baseline', 'central' )
            .attr( 'font-family', 'FontAwesome' )
            .text( function( d ) {
                return getIcon( d.data.type );
            } )

        // Add the text next to the icon
        nodeEnter.append( "text" )
            .attr( 'class', 'people_text' )
            .attr( "x", 0 )
            .attr( "y", 80 )
            .attr( "width", PeopleTreeLayout.textWidth )
            .attr( "dy", ".35em" )
            .attr( "text-anchor", "middle" )
            .style( 'fill-opacity', 0.0 )
            .style( "fill", function( d ) {
                return PeopleTreeLayout.textColour;
            } )
            .style( 'opacity',function( d ) {
                return d.data.number > 0 ? 1.0 : 0.6;
            }.bind( this ) )
            .text( function( d ) {
                return d.data.name;
            } )
            .call( wrap, PeopleTreeLayout.textWidth );

        nodeEnter.append( "text" )
            .attr( 'class', 'people_number' )
            .attr( "x", 0 )
            .attr( "y", 10 )
            .attr( "width", PeopleTreeLayout.textWidth )
            .attr( "dy", ".35em" )
            .attr( "text-anchor", "middle" )
            .style( 'fill-opacity', 0.0 )
            .style( "font-weight", 700)
            .style( "z-index", -1)
            .style( "fill", function( d ) {
                return PeopleTreeLayout.textColour;
            } )
            .style( 'opacity',function( d ) {
                return d.data.number > 0 ? 1.0 : 0.6;
            }.bind( this ) )
            .text( function( d ) {
                return d.data.number;
            } )
            .call( wrap, PeopleTreeLayout.textWidth );

        // UPDATE
        var nodeUpdate = nodeEnter.merge( node );

        // Transition to the proper position for the node
        nodeUpdate.transition("update")
            .duration( duration )
            .style( 'fill-opacity', 1 )
            .attr( "transform", function( d ) {
                return "translate(" + d.x + "," + d.y + ")";
            } );

        nodeUpdate.select( ".people_icon" ).transition().duration(fadeDuration) 
            .style( 'fill-opacity', 1 )
            .style( 'opacity',function( d ) {
                return d.data.number > 0 ? 1.0 : 0.2;
            }.bind( this ) )
            .attr( 'cursor', 'pointer' );

        nodeUpdate.select( ".people_text" ).style( "fill-opacity", 1 );
        nodeUpdate.select( ".people_number" ).style( "fill-opacity", 1 );

        // Remove any exiting nodes
        var nodeExit = node.exit().transition("exit")
            .duration( duration )
            .attr( "transform", function( d ) {
                return "translate(" + source.x + "," + source.y + ")";
            } )
            .remove();

        nodeExit.select( ".people_icon" ).transition().duration(fadeDuration) 
            .style( 'fill-opacity', 0.1 )
            .style( 'opacity',function( d ) {
                return d.data.number > 0 ? 1.0 : 0.2;
            }.bind( this ) )

        // On exit reduce the opacity of text labels
        nodeExit.select( '.people_text' )
            .style( 'fill-opacity', 1e-6 );

        // ****************** links section ***************************

        // Update the links...
        var link = state.svg.selectAll( 'path.link' )
            .data( links, function( d ) {
                return d.id;
            } );

        // Enter any new links at the parent's previous position.
        var linkEnter = link.enter().insert( 'path', "g" )
            .attr( "class", "link" )
            .attr( 'stroke-opacity', 0.2)            
            .attr( 'visibility', function( d ) {
                return d.data.number > 0 ? "visible" : "hidden";
            })
            .attr( 'd', function( d ) {
                return diagonal( d, d.parent )
            }.bind( this ) );

        // UPDATE
        var linkUpdate = linkEnter.merge( link );

        // Transition opacity of links
        linkUpdate.transition("link-update2")
            .duration( fadeDuration )
            .attr( 'stroke-opacity', function( d ) {
                return d.data.number > 0 ? 0.8 : 0.2;
            });

        // Store the old positions for transition.
        nodes.forEach( function( d ) {
            d.x0 = d.x;
            d.y0 = d.y;
        } );
    }

    /**
     *  Creates a curved (diagonal) path from parent to the child nodes
     * @param {object} s Source position
     * @param {object} d Destination position
     * @return {object} The diaglonal path
     */
    function diagonal ( s, d ) {
        var trans_sx = s.x ;
        var trans_dx = d.x ;
        var path = `M ${trans_sx} ${s.y}
            C ${( trans_sx + trans_dx ) / 2} ${s.y},
                ${( trans_sx + trans_dx ) / 2} ${d.y},
                ${trans_dx} ${d.y}`

        return path
    }

    /**
     * Toggles the node children on a click.
     * @param {object} d DOM node that was clicked
     */
    function click ( d, state ) {
        if ( d.children ) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        if (d._children || d.children) {
            update(d, state)
        }
    }
}