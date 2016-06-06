import React from 'react';
import styles from '../../common/common.css';
import ReactHighcharts from 'react-highcharts';

import {makeSegments, makeSegmentsStudentsCount} from '../../api/exam';

const FullScoreTrend = ({examInfo, examStudentsInfo}) => {
//算法数据结构：
    var result = theTotalScoreTrenderChart(examInfo, examStudentsInfo);
//自定义Module数据结构
    var config = {
        title: {
            text: '',
            x: -20 //center
        },
        xAxis: {
            categories: result['x-axon']
        },
        yAxis: {
            title: {
                text: '人数'
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        tooltip: {
            valueSuffix: '人数'
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        series: [{
            name: 'school',
            data: result['y-axon']
        }],
        credits: {
            enabled: false
        }
    }
    return (
        <div style={{ position: 'relative' }}>
            <div style={{ borderBottom: '3px solid #C9CAFD', width: '100%', height: 30 }}></div>
            <div style={{ position: 'absolute', left: '50%', marginLeft: -120, textAlign: 'center', top: 20, backgroundColor: '#fff', fontSize: 20, color: '#9625fc', width: 200 }}>
                总分分布趋势
            </div>
            <div className={styles['school-report-content']}>
                <p style={{ marginTop: 40 }}>总学生总分趋势的分布图：是这次考试检测全校学生学生综合水平状况的一个基本表现特征。</p>
                <p>总分分布曲线图如下：</p>
                <ReactHighcharts config={config} style={{ margin: '0 auto', marginTop: 40 }}></ReactHighcharts>
                <div style={{ width: 760, minHeight: 90, backgroundColor: '#e9f7f0', margin: '0 auto', marginTop: 20, padding: 15 }}>
                    <p style={{ marginBottom: 20 }}>对于这次考试: </p>

                    从总分分布曲线图来看，基本呈现“钟型分布”，即中档学生人数较多，两端（高分段，低分段）学生人数较少，这种分布属于正常状态，但作为学校水平性考试，还是希望高分段学生人数更多为好
                </div>
            </div>
        </div>
    )
}


export default FullScoreTrend;

function theTotalScoreTrenderChart(examInfo, examStudentsInfo) {
    var segments = makeSegments(examInfo.fullMark);

    var xAxons = _.slice(segments, 1);
    var yAxons = makeSegmentsStudentsCount(examStudentsInfo, segments);

    return {
        'x-axon': xAxons,
        'y-axon': yAxons
    }
}
