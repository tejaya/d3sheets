import { Component, OnInit, NgZone } from '@angular/core';
import * as  d3 from 'd3';
import {sankey , sankeyLeft, sankeyLinkHorizontal} from 'd3-sankey';

const DROPOUT_NODE_NAME = "SAMPLE_DROPOUT";
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'simple-parallel-charts';

  constructor(  private ngZone: NgZone){
    window['ue'] = window['ue'] || {};
    window['ue']['userFlow'] = window['ue']['userFlow'] || {};
    window['ue']['userFlow'].publicFunc = this.publicFunc.bind(this);
  }

  ngOnInit(){
    
      console.log("Im initialised");

      const chartData = {
        'nodes': [
          {
            'node': 0, 
            'name': 'HomeActivity', 
            'drop': 2 
          },
          
        ],
        'links': [
          {
            'source': 0,
            'target': 1,
            'value': 2
          }
          
        ]
      };
      this.drawChart(chartData);
  }

  drawChart(chartData: any): void {
    // plotting the sankey chart
       const sankey1 = sankey()
         .nodeWidth(15)
         .nodePadding(10)
          .nodeAlign(sankeyLeft)
          .extent([[1, 1], [100, 100]]);
          // sankey();
       const sankeyLinkHorizontal1 = sankeyLinkHorizontal();
       const iter = d3.nest()
         .key((d: any) => d.x0)
         .sortKeys(d3.ascending)
         .entries(chartData.nodes)
         .map((d: any) => d.key)
         .sort((a: any, b: any) => a - b);

         const interactions = iter.length;
         const width = interactions * 320;
         const height = 500;
         const formatNumber = d3.format(',.0f');
         const format = (d: any): string => formatNumber(d) + ' session(s)';
         const color = d3.scaleOrdinal(d3.schemeCategory10);
       // add svg for graph
       const svg = d3.select('#sankey').append('svg')
         .attr('width', width)
         .attr('height', height)
         .attr('viewbox', `0 0 ${width} ${height}`);
        
         const link = svg.append('g')
      .selectAll('.link')
      .data(chartData.links)
      .enter()
      .filter((l: any) => l.target.name.toLowerCase() !== DROPOUT_NODE_NAME)
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', '#9e9e9e')
      .style('opacity', '0.7')
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('class', 'link')
      .sort((a: any, b: any) => {
        if (a.target.name.toLowerCase() === DROPOUT_NODE_NAME) {
          return -1;
        } else if (b.target.name.toLowerCase() === DROPOUT_NODE_NAME) {
          return 1;
        } else {
          return 0;
        }
      });

      const dropLink = svg.append('g')
      .selectAll('.link')
      .data(chartData.links)
      .enter()
      .filter((l: any) => l.target.name.toLowerCase() === DROPOUT_NODE_NAME)
      .append('rect')
      .attr('x', (d: any) => d.source.x1)
      .attr('y', (d: any) => {
        if (d.source.drop > 0) {
          let totalWidth = 0;
          for (const elm of d.source.sourceLinks) {
            if (elm.target.name.toLowerCase() === DROPOUT_NODE_NAME) {
              break;
            } else if (elm.value >= d.source.drop && elm.target.name.toLowerCase() !== DROPOUT_NODE_NAME) {
              totalWidth += elm.width;
            }
          }
          return d.source.y0 + totalWidth;
        } else {
          return d.source.y0;
        }
      })
      .attr('height', (d: any) => Math.abs(d.target.y0 - d.target.y1))
      .attr('width', (d: any) => sankey1.nodeWidth() + 3)
      .attr('fill', '#f44336')
      .attr('stroke', '#f44336')
      .attr('class', 'dropout-node')
      .on('click', (l: any) => {
        fnOnDropOutLinkClicked(l);
      });

    dropLink.append('title')
      .text((d: any) => d.source.name + '\n' +
        'Dropouts ' + format(d.value));

    // add the link titles
    link.append('title')
      .text((d: any) => d.source.name + ' → ' +
        d.target.name + '\n' + format(d.value));
        const node = svg.append('g').selectAll('.node')
        .data(chartData.nodes)
        .enter().append('g')
        .attr('class', 'node')
        .on('mouseover', fade(1))
        .on('mouseout', fade(0.7))
        .on('click', (d) => {
          fnOnNodeClicked(d);
        });
  
      node.append('rect')
        .filter((d: any) => d.name.toLowerCase() !== DROPOUT_NODE_NAME)
        .attr('x', (d: any) => d.x0)
        .attr('y', (d: any) => d.y0)
        .attr('height', (d: any) => d.y1 - d.y0)
        .attr('width', (d: any) => d.x1 - d.x0)
        .attr('fill', '#2196f3')
        .append('title')
        .text((d: any) => d.name + '\n' + format(d.value));
  
      node.append('text')
        .filter((d: any) => d.name.toLowerCase() !== DROPOUT_NODE_NAME)
        .attr('x', (d: any) => d.x1 + 20)
        .attr('y', (d: any) => (d.y1 + d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('font-size', 10)
        .attr('font-family', 'Roboto')
        .attr('text-anchor', 'end')
        .text((d: any) => truncateText(d.name, 20))
        .attr('text-anchor', 'start')
        .append('title')
        .text((d: any) => d.name);
        
        function fade(opacity: any): any {
          return (g: any, i:any) => {
    
            svg.selectAll('.link')
              .filter((d: any) => d.source.node !== chartData.nodes[i].node && d.target.node !== chartData.nodes[i].node)
              .transition()
              .style('opacity', opacity);
          };
        }
    
        // function to format the interaction number
        function formatInteraction(num: number): string {
          const lastDigit = num % 10;
          switch (lastDigit) {
            case 1:
              return `${num}st`;
            case 2:
              return `${num}nd`;
            case 3:
              return `${num}rd`;
            default:
              return `${num}th`;
          }
        }
    
        // function gets called on click of a dropout node
        function fnOnDropOutLinkClicked(dropOutLink: any): void {
          window['ue']['userFlow'].publicFunc(dropOutLink.target, true);
        }
    
        // function gets called on click of a node
        function fnOnNodeClicked(clickedNode: any): void {
          window['ue']['userFlow'].publicFunc(clickedNode);
        }
    
        // common util function to truncate text
        function truncateText(value: any, limit: number): string {
          return value ? (value.length > limit) ? String(value).substr(0, limit - 1) + '...' : value : '';
        }
   }

   publicFunc(node: any, isDropout = false): void {
    this.ngZone.run(() => this.nodeClicked(node, isDropout));
  }

  nodeClicked(node: any, isDropout: boolean): void {
    if (isDropout) {
      console.log('dropout node clicked', node);
    } else {
      console.log('node clicked', node);
    }
  }
}
