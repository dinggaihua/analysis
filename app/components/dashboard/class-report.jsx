import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {browserHistory} from 'react-router';
import classNames from 'classnames/bind';
import Radium from 'radium';
import ReactHighcharts from 'react-highcharts';
import _ from 'lodash';
import dashboardStyle from './dashboard.css';
import {COLORS_MAP as colorsMap} from '../../lib/constants';

class ClassReport extends React.Component {
    constructor(props) {
        super(props);
    }
    viewClassReport() {
        var {examid, grade} = this.props;
        var targetUrl = grade ? '/class/report?examid=' + examid + '&grade=' + grade : '/school/report?examid=' + examid;
        browserHistory.push(targetUrl);
    }
    render(){
        var {data} = this.props;
        var classNames = _.map(data['top5ClassesMean'], (obj) => obj.name);
        var theMeans = _.map(data['top5ClassesMean'], (obj) => obj.mean);

      var average=data.gradeMean;
      var config = {
          chart: {
              type: 'column'
          },
          title: {
              text: '(分)',
              floating: true,
              x: -110,
              y: 3,
              style: {
                  "color": "#767676",
                  "fontSize": "12px"
              }
          },
          subtitle: {
              text: '',
              floating: true,
              x: -65,
              y: 18,
              style: {
                  "color": colorsMap.B03,
                  "fontSize": "12px"
              }
          },
          xAxis: {
              tickWidth: '0px',//不显示刻度
              categories: classNames,
          },
          yAxis: {
              allowDecimals: true,//刻度允许小数
              lineWidth: 1,
              gridLineDashStyle: 'Dash',
              gridLineColor: colorsMap.C03,
              title: {
                  text: ''
              },
              plotLines: [{//y轴轴线
                  value: 0,
                  width: 1,
                  color: colorsMap.C03
              }, {
                      value: average,//mork数据
                      color: colorsMap.B03,
                      dashStyle: 'Dash',
                      width: 1,
                      label: {
                          text: '',
                          align: 'right',
                          x: 0,
                          y: 5

                      }
                  }],

          },
          credits: {
              enabled: false
          },

          legend: {
              enabled: false,
              align: 'center',
              verticalAlign: 'top',
              symbolHeight: 1,
              symbolWidth: 0
          },
          plotOptions: {
              column: {
                  pointWidth: 16,//柱宽
              }
          },

          series: [
              {
                  name: '校级平均分:' + average,
                  color: colorsMap.B03,
                  data: [100, 150, 300, 200, 300],
              }
          ],
          tooltip: {
              enabled: false,
              backgroundColor: '#000',
              borderColor: '#000',
              style: {
                  color: '#fff'
              },
              formatter: function () {
                  return this.series.name + ':' + this.point.y + '人'
              }
          },
      };
        return (
        <div style={{display: 'inline-block', height: 317, padding: '0 10px 0 0', cursor: 'pointer'}}  className='col-lg-4 dashboard-card'
            onClick={this.viewClassReport.bind(this)}
            >
            <div style={{width: '100%', height: '100%', backgroundColor: '#fff', borderRadius: 2, padding: '0 30px'}}>
                <div id='scoreRankHeader' style={{ height: 58, lineHeight: '58px', borderBottom: '1px solid #f2f2f2', cursor: 'pointer' }}>
                    <span style={{ color: '#333', fontSize: 16, marginRight: 10 }}>班级分析报告</span>
                    <span style={{ color: '#333', fontSize: 12 }}>平均分TOP5</span>
                    <span style={{ float: 'right', color: '#bfbfbf' }}><i className='icon-right-open-2'></i></span>
                </div>
                <ReactHighcharts config={config} style={{ maxWidth: 330, maxHeight: 230}}></ReactHighcharts>
            </div>
            {/*<div className={dashboardStyle['class-report-img']}></div>*/}
        </div>
    )
    }

}

export default Radium(ClassReport);


 // 暂时注释掉以下config的计算，用静态图片代替highchart整个卡片。
    // var classNames = _.map(data['top5ClassesMean'], (obj) => obj.name+'班');
    // var gradeMeans = _.range(classNames.length).map(num => {
    //     var obj = {};
    //     obj.name = '年级平均分';
    //     obj.value = data.gradeMean;
    //     obj.y = data.gradeMean;
    //     return obj;
    // })
    // var classMeans =  _.map(data['top5ClassesMean'], (obj) => {
    //     var newObj = {};
    //     newObj.name = obj.name + '班',
    //     newObj.value = obj.mean;
    //     newObj.y = obj.mean - data.gradeMean;
    //     return newObj;
    // });
    // var config = {
    //     chart: {
    //         type: 'bar'
    //     },
    //     title: {
    //         text: ''
    //     },
    //     subtitle: {
    //         text: ''
    //     },
    //     tooltip: {
    //         pointFormat: '平均分:{point.value}'
    //     },
    //     colors: ['#24aef8','#35d1c7'],
    //     xAxis: {
    //         categories: classNames,
    //         crosshair: true,
    //         tickColor: '#fff',
    //         lineColor: '#fff'
    //     },
    //     yAxis: {
    //         min: 0,
    //         gridLineColor: '#fff'
    //     },
    //     plotOptions: {
    //         column: {
    //             pointPadding: 0.2,
    //             borderWidth: 0
    //         },
    //         series: {
    //             stacking: 'normal'
    //         }
    //     },
    //     series: [{
    //         name: '各班平均分',
    //         data: classMeans
    //     },{
    //         name: '年级平均分',
    //         data: gradeMeans
    //     }],
    //     credits: {
    //         enabled: false
    //     },
    //     legend: {
    //         enabled: true,
    //         align: 'left'
    //     }
    // };
