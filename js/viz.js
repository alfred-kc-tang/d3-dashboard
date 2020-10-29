var margin = {top: 50, right: 150, bottom: 50, left: 150},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom,
    barPadding = 5;

var svg = d3.select("body")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", (height + margin.top + margin.bottom)/2)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseYear = d3.timeParse("%Y");

// load the data and then group the count by region and year
d3.csv("state-year-earthquakes.csv")
  .then(function(data) {
    var nestedData = d3.nest()
                       .key(function(d) {return d.region;})
                       .key(function(d) {return d.year;})
                       .rollup(function(d) {
                          return d3.sum(d, function(d) {return d.count;});
                        })
                       .entries(data)
                       .sort(function(a, b) {return d3.ascending(a.key, b.key);});

    // define x-scale
    var xScale = d3.scaleTime()
                   .domain(d3.extent(data, function(d) {return parseYear(d.year);}))
                   .range([0, width]);

    // define y-scale
    var yScale = d3.scaleLinear()
                   .domain([0, d3.max(nestedData, function(d) {
                      var maxes = d3.max(d.values, function(d) {return d.value;})
                        return maxes;
                      })])
                   .range([(height - margin.top- margin.bottom)/2, 0]);

    svg.append("g")
       .attr("class", "x-axis")
       .attr("transform", "translate(0," + (height - margin.top - margin.bottom)/2 + ")")
       .call(d3.axisBottom(xScale))
       .style("font-size", "16px");

    svg.append("g")
       .attr("class", "y-axis")
       .call(d3.axisLeft(yScale))
       .style("font-size", "16px");

    // define the specified color scheme
    var colorScheme = d3.scaleOrdinal()
                        .domain(["Midwest", "Northeast", "South", "West"])
                        .range(["#cb181d", "#2171b5", "#238b45", "#6a51a3"]);

    // define the two event listeners for the mouseover effect
    var handleMouseOver = function(d) {
      // change the dot to a larger size
      d3.select(this)
        .attr("r", 9);

      var svg2 = d3.select("body")
                   .append("svg")
                   .attr("id", "barchart")
                   .attr("width", width + margin.left + margin.right)
                   .attr("height", height + margin.top + margin.bottom)
                   .append("g")
                   .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var selReg = this.parentNode.__data__.key,
          selYear = d.key,
          selData = data.filter(function(d) {
            return d.region == selReg && d.year == selYear;
          }).sort(function(a, b) {
            if (+a.count == +b.count) {
              return d3.ascending(a.state, b.state);
            } else {
              return d3.ascending(+a.count, +b.count);
            }
          });

      // define x-scale
      var x = d3.scaleLinear()
                .domain([0, d3.max(selData, function(d) {return +d.count;})])
                .range([0, width]);

      // define y-scale
      var y = d3.scaleBand()
                .domain(selData.map(function(d) {return d.state}))
                .range([(height - margin.top- margin.bottom)/2, 0])
                .padding(0.1);

      svg2.append("g")
          .attr("class", "x-axis")
          .attr("transform", "translate(0," + (height - margin.top - margin.bottom)/2 + ")")
          .call(d3.axisBottom(x))
          .style("font-size", "16px");

      svg2.append("g")
          .attr("class", "y-axis")
          .call(d3.axisLeft(y))
          .style("font-size", "16px");

      // create bars representing the states in the selected region and year
      var bars = svg2.selectAll(".bar")
                     .data(selData)
                     .enter()
                     .append("g");

      bars.append("rect")
          .attr("class", "bar")
          .attr("x", 0)
          .attr("y", function(d) {return y(d.state)})
          .attr("width", function(d) {return x(d.count)})
          .attr("height", y.bandwidth())
          .style("fill", "#2171b5");

      // add gridlines on the x-axis
      svg2.append("g")
          .attr("class", "grid")
          .attr("transform", "translate(0," + (height - margin.top - margin.bottom)/2 +")")
          .call(d3.axisBottom(x)
            .ticks(5)
            .tickSizeInner(-(height - margin.top- margin.bottom)/2)
            .tickSizeOuter(0)
            .tickFormat(""));

      // add the title
      svg2.append("text")
          .attr("x", width/2)
          .attr("y", -margin.top/2)
          .style("font-size", "28px")
          .style("dx", "1em")
          .style("text-anchor", "middle")
          .text(selReg + "ern Region Earthquakes " + selYear);

      // add the x-axis title
      svg2.append("text")
          .attr("x", (width - margin.left/4)/2)
          .attr("y", height/2)
          .attr("dx", "1em")
          .style("font-size", "20px")
          .style("text-anchor", "middle")
          .text("Count");

      // add the y-axis title
      svg2.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -((height - margin.top - margin.bottom)/4))
          .attr("y", -margin.left/1.1)
          .attr("dy", "1em")
          .style("font-size", "20px")
          .style("text-anchor", "middle")
          .text("State");
    }

    var handleMouseOut = function() {
      d3.select(this)
        .attr("r", 3);

      d3.select("#barchart").remove();
    }

    // define the line function for creating multiple lines
    var line = d3.line()
                 .x(function(d) {return xScale(parseYear(d.key));})
                 .y(function(d) {return yScale(d.value);});

    // create multiple lines and dots in their respective colors
    var region = svg.selectAll(".region")
                    .data(nestedData)
                    .enter()
                    .append("g")
                    .attr("class", "region");

    region.append("path")
          .attr("class", "line")
          .attr("fill", "none")
          .attr("d", function(d) {return line(d.values);})
          .style("stroke-width", "2px")
          .style("stroke", function(d) {return colorScheme(d.key);});

    region.selectAll("circle")
          .data(function(d) {return d.values;})
          .enter()
          .append("circle")
          .attr("r", 3)
          .attr("cx", function(d) {return xScale(parseYear(d.key));})
          .attr("cy", function(d) {return yScale(d.value);})
          .style("stroke-width", "1px")
          .style("stroke", "white")
          .style("fill", function(d) {return colorScheme(this.parentNode.__data__.key);})
          .on("mouseover", handleMouseOver)
          .on("mouseout", handleMouseOut);

    var legend = svg.selectAll(".legend")
                    .data(nestedData)
                    .enter()
                    .append("g")
                    .attr("class", "legend")
                    .attr("transform", function (d, i) {
                       return "translate(" + (width + (margin.right/4)) + "," + (i*20)+")";
                     });

    // add the legend (both the magnitude categories and their colors)
    legend.append("text")
          .text(function (d) {return d.key;})
          .attr("transform", "translate(10,5)");

    legend.append("circle")
          .attr("r", 5)
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("fill", function (d) {return colorScheme(d.key);})

    // add the title
    svg.append("text")
       .attr("x", width/2)
       .attr("y", -margin.top/2)
       .style("font-size", "28px")
       .style("dx", "1em")
       .style("text-anchor", "middle")
       .text("US Earthquakes by Region 2000-2015");

    // add the x-axis title
    svg.append("text")
       .attr("x", (width - margin.left/4)/2)
       .attr("y", height/2)
       .attr("dx", "1em")
       .style("font-size", "20px")
       .style("text-anchor", "middle")
       .text("Year");

    // add the y-axis title
    svg.append("text")
       .attr("transform", "rotate(-90)")
       .attr("x", -((height - margin.top - margin.bottom)/4))
       .attr("y", -margin.left/1.5)
       .attr("dy", "1em")
       .style("font-size", "20px")
       .style("text-anchor", "middle")
       .text("Count of Earthqaukes");
  })