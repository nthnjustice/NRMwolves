const defaultSources = [
  'num.wolves',
  'MT.wolves',
  'WY.wolves',
  'ID.wolves',
  'OR.wolves',
  'WA.wolves'
];

const colors = {
  'num.wolves': '#f44336',
  'MT.wolves': '#9c27b0',
  'WY.wolves': '#2196f3',
  'ID.wolves': '#4caf50',
  'OR.wolves': '#ffeb3b',
  'WA.wolves': '#795548'
};

const labels = {
  'num.wolves': 'Total',
  'MT.wolves': 'Montana',
  'WY.wolves': 'Wyoming',
  'ID.wolves': 'Idaho',
  'OR.wolves': 'Oregon',
  'WA.wolves': 'Washington'
}

const abbrvs = {
  'num.wolves': 'Tot',
  'MT.wolves': 'MT',
  'WY.wolves': 'WY',
  'ID.wolves': 'ID',
  'OR.wolves': 'OR',
  'WA.wolves': 'WA'
};

let activeYear = '2012'

const plotHeight = 400;

$(document).ready(function() {
  $('select').formSelect();

  initSourceInput();

  renderOverTimePlot(defaultSources.sort());
  renderInYearPlot(defaultSources.sort());
});

function initSourceInput() {
  $('#source').on('change', function() {
    let instance = M.FormSelect.getInstance(this);
    let selected = instance.getSelectedValues();

    d3.select('#overtime').selectAll('svg').remove();
    d3.select('#inyear').selectAll('svg').remove();
 
    if (selected.length > 0) {
      renderOverTimePlot(selected.sort());
      renderInYearPlot(selected.sort());
      $('.vis-wrapper').removeClass('hidden');
      $('.helper-text').addClass('hidden');
    } else {
      $('.vis-wrapper').addClass('hidden');
      $('.helper-text').removeClass('hidden');
    }
  });
}

function findMin(data, col) {
  let min = data[0][col];

  data.map((obj) => {
    if (obj[col] != '') {
      if (Number(obj[col]) < min) {
        min = obj[col];
      }
    }
  });

  return min;
}

function findMax(data, cols) {
  let max = data[0][cols[0]];

  for (let i = 0; i < cols.length; i++) {
    let col = cols[i];

    data.map((obj) => {
      if (obj[col] != '') {
        if (Number(obj[col]) > max) {
          max = obj[col];
        }
      }
    });
  }

  return max;
}

function parseOverTimeData(data, cols) {
  return(
    data.map((entry) => {
      let obj = {};

      for (let i = 0; i < cols.length; i++) {
        obj[cols[i]] = entry[cols[i]];
        obj.year = entry.year;
      }

      return obj;
    })
  );
}

function resetYearTicks(vis) {
  vis.selectAll('.tick').each(function() {
    if (this.textContent != activeYear) {
      this.classList.remove('year-active');
    }
  });
}

async function renderOverTimePlot(sources) {
  let data = await d3.csv('NRMwolves.csv');

  data = parseOverTimeData(data, sources);

  let margin = {
    bottom: 50,
    left: 60,
    top: 50,
    right: 60
  };

  let width = $('#overtime').width() - margin.left - margin.right;
  let height = plotHeight - margin.top - margin.bottom;

  let xScale = d3.scaleLinear()
    .domain([findMin(data, 'year'), findMax(data, ['year'])])
    .range([0, width]);

  let yScale = d3.scaleLinear()
    .domain([0, findMax(data, sources)])
    .range([height, 0]);

  let vis = d3.select('#overtime').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.bottom + margin.top)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.right + ')');

  let legendPos = 10;
  
  vis.append('g')
    .attr('class', 'xAxis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(xScale).ticks(data.length).tickFormat(function(d) {
      return Number(d);
    }));

  vis.selectAll('.tick').each(function() {
    if (this.textContent == activeYear) {
      this.classList.add('year-active');
    }
  }).on('click', function() {
    this.classList.add('year-active');
    activeYear = this.textContent;
    resetYearTicks(vis);
    d3.select('#inyear').selectAll('svg').remove();
    renderInYearPlot(sources);
    $('.inyear-title').text(activeYear);
  });

  vis.append('g')
    .attr('class', 'yAxis')
    .call(d3.axisLeft(yScale));

  vis.append('text')
    .attr('class', 'label')
    .attr('x', width / 2)
    .attr('y', height + 40)
    .attr('text-anchor', 'middle')
    .text('Year');

  vis.append('text')
    .attr('class', 'label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -1 * (height / 2))
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .text('Count');

  sources.map((source) => {
    let state = source.substring(0, 2);

    vis.append('path')
      .datum(data)
      .attr('class', 'line-' + state)
      .attr('d', d3.line()
        .x(function(d) {
          return xScale(d.year);
        })
        .y(function(d) {
          if (d[source] === undefined) {
            return yScale(0);
          } else {
            return yScale(d[source]);
          }
        })
      );

    vis.selectAll('.point-' + state)
      .data(data).enter()
        .append('circle')
          .attr('class', 'point-' + state)
          .attr('cx', function(d) {
              return xScale(d.year);
          })
          .attr('cy', function(d) {
            if (d[source] === undefined) {
              return yScale(0);
            } else {
              return yScale(d[source]);
            }
          })
          .attr('r', 5)
          .on('mouseover', function() {
            d3.select(this)
              .attr('class', 'focus');
          })
          .on('mouseout', function() {
            d3.select(this)
              .attr('class', 'point-' + state);
          })
          .append('title')
            .text(function(d) {
              let l1 = 'Source: ' + labels[source];
              let l2 = 'Year: ' + d.year;
              let l3 = 'Population: ' + d[source];
  
              return l1 + '\n' + l2 + '\n' + l3;
            });

    vis.append('rect')
      .attr('width', 16)
      .attr('height', 16)
      .attr('class', 'point-' + state)
      .attr('x', 25)
      .attr('y', legendPos);

    vis.append('text')
      .attr('x', 25 + 16 + 5)
      .attr('y', legendPos + 14)
      .attr('class', 'legend')
      .text(labels[source]);

    legendPos += 30;
  })
}

function parseInYearData(data, cols) {
  let output = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].year == activeYear) {
      let entry = data[i];

      cols.map((col) => {
        let obj = {};

        obj.source = col;
        obj.count = entry[col];
        output.push(obj);
      })
    }
  }

  return output;
}

function findYearMax(data) {
  let max = 0;

  data.map((obj) => {
    if (Number(obj.count) > max) {
      max = obj.count;
    }
  })

  return max;
}

async function renderInYearPlot(sources) {
  let data = await d3.csv('NRMwolves.csv');

  data = parseInYearData(data, sources);

  let margin = {
    bottom: 50,
    left: 50,
    top: 50,
    right: 50
  };

  let width = $('#inyear').width() - margin.left - margin.right;
  let height = plotHeight - margin.top - margin.bottom;

  let xScale = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.6)
    .domain(data.map(function(d) {
      return abbrvs[d.source];
    }));

  let yScale = d3.scaleLinear()
    .domain([0, findYearMax(data)])
    .range([height, 0]);

  let vis = d3.select('#inyear').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.bottom + margin.top)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.right + ')');
  
  vis.append('g')
    .attr('class', 'souce-xAxis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(xScale));

  vis.append('g')
    .attr('class', 'yAxis')
    .call(d3.axisLeft(yScale));

    vis.append('text')
      .attr('class', 'source-label')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .text('Source');

  vis.selectAll('bar')
    .data(data).enter()
      .append('rect')
        .style('fill', function(d) {
          return colors[d.source];
        })
        .attr('x', function(d) {
          return xScale(abbrvs[d.source]); 
        })
        .attr('width', xScale.bandwidth())
        .attr('y', function(d) {
          return yScale(d.count);
        })
        .attr('height', function(d) {
          return height - yScale(d.count);
        })
        .append('title')
          .text(function(d) {
            let l1 = 'Source: ' + abbrvs[d.source];
            let l2 = 'Year: ' + activeYear;
            let l3 = 'Population: ' + d.count;

            return l1 + '\n' + l2 + '\n' + l3;
          });
}