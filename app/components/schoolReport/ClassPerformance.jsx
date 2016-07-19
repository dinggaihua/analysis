import React from 'react';
import ReactHighcharts from 'react-highcharts';
import _ from 'lodash';

import Table from '../../common/Table';
import DropdownList from '../../common/DropdownList';

import {makeSegments, makeFactor, makeSegmentsStudentsCount} from '../../api/exam';
import {NUMBER_MAP as numberMap, A11, A12, B03, B04, B08, C12, C05, C07} from '../../lib/constants';
import styles from '../../common/common.css';
import schoolReportStyles from './schoolReport.css';
import TableView from './TableView';
import {Table as BootTable} from 'react-bootstrap';

const AverageTable = ({tableHeaderData, tableData}) => {

    return (
        <BootTable  bordered hover responsive>
            <tbody>
                <tr style={{ backgroundColor: '#fafafa' }}>
                    <th className={styles['table-unit']} rowSpan="2">班级</th>
                    {
                        _.map(tableHeaderData, (subject, index) => {
                            return (
                                <th colSpan="2" key={index} className={styles['table-unit']} style={{minWidth: 100}}>{subject}</th>
                            )
                        })
                    }
                </tr>
                <tr style={{ backgroundColor: '#fafafa' }}>
                {
                    _.map(_.range(tableHeaderData.length), (num) => {
                        return _.map(_.range(2), (index) => {
                            if (index === 0)
                                return <th className={styles['table-unit']} key={index} style={{minWidth: 100}}>平均分</th>
                            return <th className={styles['table-unit']} key={index} style={{minWidth: 100}}>平均得分率</th>
                        })
                    })
                }
                </tr>
                {
                    _.map(tableData, (tdList, bindex) => {
                        return (
                            <tr key={'tr' + bindex}>
                                {
                                    _.map(tdList, (td, tindex) => {
                                        return (
                                            <td key={'td' + tindex}className={styles['table-unit']} style={{minWidth: 100}}>
                                                {td}
                                            </td>
                                        )
                                    })
                                }
                            </tr>
                        )
                    })
                }
            </tbody>
        </BootTable>
    )
}

/**
 * props:
 * totalScoreLevel: 分档信息
 */
    class ClassPerformance extends React.Component {

    constructor(props) {
        super(props);

        var {studentsGroupByClass, examInfo} = this.props;
        var classList = _.map(_.keys(studentsGroupByClass), (className) => {
            return {key: className, value: examInfo.gradeName+className+'班'};
        });

        this.classList = classList;

        this.state = {
            currentClasses: _.take(this.classList, 2)
        }
    }

    onClickDropdownList(classItem) {
        //if(_.includes(this.classList, classItem)) return;
        console.log('change the choosen class = ', classItem.key);
        var {currentClasses} = this.state;
        if (_.includes(currentClasses)) return;
        else if (classItem.selected){
            currentClasses.push(classItem);
            this.setState({
                currentClasses: currentClasses
            });
        } else {
            this.setState({
                currentClasses: _.without(currentClasses, classItem)
            });
        }


        // if(!lineChartMockData[chosenClass]) return ;
        // var obj = {};
        // obj.name = chosenClass;
        // obj.data = lineChartMockData[chosenClass];
        // lineChartRenderData = [].concat([lineChartRenderData[1], obj]);
        // this.forceUpdate();
    }

    render() {
//Props数据结构：
        var {examInfo, examStudentsInfo, examPapersInfo, examClassesInfo, studentsGroupByClass, levels, headers} = this.props;
//算法数据结构：

// var lineChartRenderData = [{
//                 name: '全校',
//                 data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
//             },{
//                 name: '初一1班',
//                 data: [11.2, 9.6, 19.5, 85.5, 21.8, 12.5, 87.5, 78.5, 33.3, 8.3, 23.9, 5.6]
//             }];
        var headerInfo = theClassExamHeader(studentsGroupByClass);
        var {xAxons, yAxonses} = theClassExamChart(examInfo, examStudentsInfo, examClassesInfo, this.state.currentClasses);
        var subjectMeanInfo = makeClassExamMeanInfo(examStudentsInfo, examPapersInfo, examInfo, examClassesInfo, studentsGroupByClass);
        var meanTableBodyData = theClassExamMeanTable(examInfo, subjectMeanInfo, headers);
        var factorsTableData = theClassExamMeanFactorsTable(examInfo, subjectMeanInfo, studentsGroupByClass, headers);
        var groupTableData = theClassExamTotalScoreGroupTable(examInfo, examStudentsInfo);
//自定义Module数据结构：
        var _this = this;
        var meanTableHeaderData = _.map(headers, (headerObj) => headerObj.subject);

        var config = {
            title: {
                text: '',
                x: -20 //center
            },
            xAxis: {
                categories: xAxons
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
            series: yAxonses,
            credits: {
                enabled: false
            }
        };

        return (
            <div className={schoolReportStyles['section']}>
                <div style={{ marginBottom: 30 }}>
                    <span style={{ border: '2px solid ' + B03, display: 'inline-block', height: 20, borderRadius: 20, margin: '2px 10px 0 0', float: 'left' }}></span>
                    <span style={{ fontSize: 18, color: C12, marginRight: 20 }}>班级的考试基本表现</span>
                    <span style={{ fontSize: 12, color: C07 }}>通过各班在数据上的突出表现及其差异，来分析不同班级之间的考试表现情况，但要注意结合各班级的实际教学情况及历史原因，做客观分析判断。</span>
                </div>
                {/* 线图 + 高分多寡班级 */}
                <div style={{display: 'inline-block', width: 875, height: 380, position: 'relative'}}>
                    <ReactHighcharts config={config} style={{width: '100%', height: '100%'}}></ReactHighcharts>
                    <span style={{position: 'absolute', top: 0, right: 0}}>
                        <span style={{display: 'table-cell', paddingRight: 10}}>对比对象</span>
                        <span style={{display: 'table-cell'}}><DropdownList onClickDropdownList={this.onClickDropdownList.bind(this)} classList={_this.classList} isMultiChoice={true}/></span>
                    </span>
                </div>
                <div style={{display: 'inline-block', width: 215, float: 'right'}}>
                    <div style={{ display: 'table-row'}}>
                        <div style={{ width: 215, height: 110, border: '1px solid ' + C07, borderRadius: 2, display: 'table-cell', verticalAlign: 'middle', textAlign: 'center' }}>
                            <p style={{ fontSize: 12, marginBottom: 10 }}>高分学生较多的班级</p>
                            <p style={{ fontSize: 30, color: B08 }}>{_.join(headerInfo.greater, '、') }</p>
                        </div>
                    </div>
                    <div style={{height: 20}}></div>
                    <div style={{width: 215, height: 110, border: '1px solid ' + C07, borderRadius: 2, display: 'table-cell', verticalAlign: 'middle', textAlign: 'center'}}>
                        <p style={{fontSize: 12, marginBottom: 10}}>高分学生较少的班级</p>
                        <p style={{fontSize: 30, color: B04}}>{_.join(headerInfo.lesser, '、')}</p>
                    </div>
                    <p style={{fontSize: 12, color: C07, marginTop: 20}}>
                        <span style={{color: B08}}>*</span>
                        高分年级结论以各班自身水平为基础推导得出，可能会有特别好的班级也出现相对与班级自身水平的高分学生人数少于低分学生人数的，说明该班级还没有充分挖掘出学生的潜力
                    </p>
                </div>

                {/* 平均得分率表格 */}
                <p style={{marginBottom: 20}}>
                    <span className={schoolReportStyles['sub-title']}>学科平均分/平均得分率</span>
                    <span className={schoolReportStyles['title-desc']}>平均得分率=班级平均分÷学科的总分，数值越高，班级的此学科越优秀</span>
                </p>
                <TableView tableHeaderData={meanTableHeaderData} tableData={meanTableBodyData} TableComponent={AverageTable} reserveRows={6}/>

                {/* 得分率贡献指数 */}
                <p style={{marginBottom: 20, marginTop: 40}}>
                    <span className={schoolReportStyles['sub-title']}>班级学科得分率贡献指数</span>
                    <span className={schoolReportStyles['title-desc']}>得分率贡献指数 = 班级学科得分率 - 全校学科平均得分率。指数值为正，是促进作用；为负，是拖后腿。</span>
                </p>
                <TableView tableData={factorsTableData} reserveRows={6}/>
            </div>
        )
    }
}

export default ClassPerformance;


//这个是不是也要遵从：2， 4， 7 原则？
function theClassExamHeader(studentsGroupByClass) {
    //对各个班级计算：1.此班级中排名中间的学生的成绩 2.此班级的平局分  3.二者的差
    //studentsGroupByClass应该就是排好序的。
    //问题：只能说明高分段和低分段的比较，但是不能说明是总体是高分多还是低分多，比如[1, 1, 1, 1, 1]和[99, 99, 99, 99, 99]，diff都是0

    //偏度：均值 - 中位数 (纵轴就是“频数”) -- 正偏度：右侧较少，左侧较多；  负偏度：左侧较多，右侧较少。如果对应到横坐标从左到右是依次升序的分数，那么，
    //按照偏度的大小排序，越大则低分多，高分少，低分多。

/*
        var baseLineCount = counts.length - 1;
        var targetCount = (baseLineCount == 2 || baseLineCount == 3) ? 1 : ((baseLineCount >= 4 && baseLineCount < 7) ? 2 : ((baseLineCount >= 7) ? 3 : 0));

        if(targetCount == 0) return;

 */
    var baseLineCount = _.size(studentsGroupByClass) - 1;
    var targetCount = (baseLineCount == 2 || baseLineCount == 3) ? 1 : ((baseLineCount >= 4 && baseLineCount < 7) ? 2 : ((baseLineCount >= 7) ? 3 : 0));
    if(targetCount == 0) return {};
    var results = _.map(studentsGroupByClass, (students, className) => {
        var diff = _.round(_.subtract(_.mean(_.map(students, (student) => student.score)), students[parseInt(students.length/2)].score), 2);
        return {
            diff: diff,
            class: className+'班'
        }
    });
    //diff越小则低分段比高分段多，diff越大则高分段比低分段多。因为这里还是没有确定什么是高分，什么是低分。
    results = _.sortBy(results, 'diff');
    return {
        greater: _.map(_.take(results, targetCount), (obj) => obj.class),
        lesser: _.map(_.takeRight(results, targetCount), (obj) => obj.class)
    }
}

//一个班级或两个班级的图表
function theClassExamChart(examInfo, examStudentsInfo, examClassesInfo, currentClasses) {
    var classKeys = _.keys(examClassesInfo);

    if(!currentClasses || currentClasses.length == 0) currentClasses = _.map(_.range(2), (index) => examClassesInfo[classKeys[index]]);//初始化的时候显示默认的2个班级
    var examStudentsGroupByClass = _.groupBy(examStudentsInfo, 'class');
    // var result = {};

    var segments = makeSegments(examInfo.fullMark);
    var xAxons = _.slice(segments, 1);

//只有班级没有全校！！！
    var yAxonses = _.map(currentClasses, (classItem) => {
        var students = examStudentsGroupByClass[classItem.key];
        var yAxons = makeSegmentsStudentsCount(students, segments);
        return {
            name: classItem.value,
            data: yAxons
        }
    });

    //TODO: yAxons
    return {xAxons: xAxons, yAxonses: yAxonses};
}

function theClassExamMeanTable(examInfo, subjectMeanInfo, headers) {
//TODO: 注意原型图中少画了总分这一项（有很多地方都是），而这里添加了关于总分的数据（还是第一列，跟着headers走）
    var matrix = [];

    var totalSchoolMeanObj = subjectMeanInfo.totalSchool;
    var totalSchoolRow = [];
    _.each(headers, (headerObj) => {
        totalSchoolRow = _.concat(totalSchoolRow, [totalSchoolMeanObj[headerObj.id].mean, totalSchoolMeanObj[headerObj.id].meanRate])
    });
    totalSchoolRow.unshift('全校');
    matrix.push(totalSchoolRow);

    _.each(subjectMeanInfo, (subjectMeanObj, theKey) => {
        if(theKey == 'totalSchool') return;

        var classMeanObj = subjectMeanInfo[theKey];

        var classRow = [];
        _.each(headers, (headerObj) => {
            var tempObj = (classMeanObj[headerObj.id]) ? [classMeanObj[headerObj.id].mean, classMeanObj[headerObj.id].meanRate] : ['无数据', '无数据'];
            classRow = _.concat(classRow, tempObj);
        });
        classRow.unshift(examInfo.gradeName+theKey+'班');
        matrix.push(classRow);
    });
    return matrix;
}

/**
 * //是平均得分率的小数表示的matrix
 * @param  {[type]} subjectMeanInfo [description]
 * @param  {[type]} headers         [description]
 * @return {[type]}                 [description]
 */
function theClassExamMeanFactorsTable(examInfo, subjectMeanInfo, studentsGroupByClass, headers) {
    //注意：原型图中是画错的，取离差后肯定就没有totalScore（总分）这一列了，因为在第二步的时候消除了
    var titleHeader = _.map(headers.slice(1), (obj) => obj.subject);
    titleHeader.unshift('班级');

    var originalMatrix = makeClassExamMeanOriginalMatirx(subjectMeanInfo, headers);
    var factorsMatrix = makeFactor(originalMatrix);

    var classKeys = _.keys(studentsGroupByClass);
    _.each(factorsMatrix, (factorsInfoRow, index) => {
        factorsInfoRow.unshift(examInfo.gradeName+classKeys[index]+'班');
    });

    factorsMatrix.unshift(titleHeader);

    return factorsMatrix;
}

function makeClassExamMeanOriginalMatirx(subjectMeanInfo, headers) {
    var matrix = [];
    var totalSchoolMeanObj = subjectMeanInfo.totalSchool;

    matrix.push(_.map(headers, (headerObj) => totalSchoolMeanObj[headerObj.id].meanRate));

    _.each(subjectMeanInfo, (subjectMenaObj, theKey) => {
        if(theKey == 'totalSchool') return;
        matrix.push(_.map(headers, (headerObj) => (subjectMenaObj[headerObj.id]) ? subjectMenaObj[headerObj.id].meanRate : '无数据'));
    });
    return matrix;
}

//按照分组得到的总分区间段查看学生人数
/*
    {
        <组id>: {
            groupCount:
            groupStudentsGroupByClass:{
                <className>: <students>
            }
        },
        ...
    }

    将上述的Map打散，为了符合横向扫描的方式
    [
        {class: , groupKey: students: },

    ]
*/
function theClassExamTotalScoreGroupTable(examInfo, examStudentsInfo, groupLength) {
    groupLength = groupLength || 10;
    var groupStudentsInfo = makeGroupStudentsInfo(groupLength, examStudentsInfo);

    var groupHeaders = _.map(_.range(groupLength), (index) => {
        return {index: index, title: '第' + numberMap[index+1] + '组<br/>(前' + (index+1) + '0%)', id: index }
    });
    var titleHeader = _.concat(['班级'], _.map(groupHeaders, (headerObj, index) => headerObj.title));

    var table = [], totalSchoolInfo = [];

    table.push(titleHeader);

    var allGroupStudentInfoArr = []; //因为后面维度不一样了，所以这里需要打散收集信息然后再group
    _.each(groupStudentsInfo, (groupObj, groupKey) => {
        totalSchoolInfo.push(groupObj.groupCount);
        _.each(groupObj.classStudents, (students, className) => {
            allGroupStudentInfoArr.push({ 'class': className, groupKey: groupKey, students: students });
        });
    });


    totalSchoolInfo.unshift('全校');
    table.push(totalSchoolInfo);

    var groupStudentInfoByClass = _.groupBy(allGroupStudentInfoArr, 'class');

    _.each(groupStudentInfoByClass, (groupStudentsObjArr, className) => {
        //一行
        var classGroupCountRow = _.map(_.range(groupLength), (index) => {
            //本来可以直接对groupKey进行排序，但是这样不会知道具体是哪个组的值缺少了，所以还是需要对应key去确定
            var target = _.find(groupStudentsObjArr, (sobj) => sobj.groupKey == index);
            return target ? target.students.length : 0;
        });
        classGroupCountRow.unshift(examInfo.gradeName+className+'班');
        table.push(classGroupCountRow);
    });

    return table;
}

function makeClassExamMeanInfo(examStudentsInfo, examPapersInfo, examInfo, examClassesInfo, studentsGroupByClass) {
    var result = {};
    result.totalSchool = makeOriginalSubjectInfoRow(examStudentsInfo, examPapersInfo, examInfo, examClassesInfo);
    _.each(studentsGroupByClass, (students, className) => {
        result[className] = makeOriginalSubjectInfoRow(students, examPapersInfo, examInfo, examClassesInfo);
    });
    return result;
}

//一行的得分率！！！
function makeOriginalSubjectInfoRow(students, examPapersInfo, examInfo, examClassesInfo) {
    var result = {};
    result.totalScore = {};

    result.totalScore.mean = _.round(_.mean(_.map(students, (student) => student.score)), 2);
    result.totalScore.count = _.filter(students, (student) => student.score >= result.totalScore.mean).length;
    result.totalScore.meanRate = _.round(_.divide(result.totalScore.mean, examInfo.fullMark), 2);//注意这里没有使用百分制

    result.totalScore.countPercentage = _.round(_.multiply(_.divide(result.totalScore.count, students.length), 100), 2);//注意这里使用了百分制
    _.each(_.groupBy(_.concat(..._.map(students, (student) => student.papers)), 'paperid'), (papers, pid) => {
        var obj = {};

        obj.mean = _.round(_.mean(_.map(papers, (paper) => paper.score)), 2);
        obj.count = _.filter(papers, (paper) => paper.score >= obj.mean).length;
        obj.meanRate = _.round(_.divide(obj.mean, examPapersInfo[pid].fullMark), 2);//注意这里没有使用百分制
        obj.countPercentage = _.round(_.multiply(_.divide(obj.count, students.length), 100), 2);//注意这里使用了百分制

        result[pid] = obj;
    });
    return result;
}


//groupLength来源于dialog的设置
function makeGroupStudentsInfo(groupLength, students) {
    //需要原始的“根据考生总分排序好的” studentsInfo 数组
    //将数组内的元素分成10组，计算每一组中各个班级学生人数
    var result = {}, flagCount = students.length, totalStudentCount = students.length;
    _.each(_.range(groupLength), function(index) {
        var groupCount = (index == groupLength-1) ? flagCount : (_.ceil(_.divide(totalStudentCount, groupLength)));
        //当前组的学生数组：
        var currentGroupStudents = _.slice(students, (flagCount - groupCount), flagCount);
        //对当前组的学生按照班级进行group
        var groupStudentsGroupByClass = _.groupBy(currentGroupStudents, 'class');
        flagCount -= groupCount;
        result[index] = { groupCount: groupCount, classStudents: groupStudentsGroupByClass, flagCount: flagCount };
    });
    return result;
}


/*
var lineChartMockData ={
    '全校': [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6],
    '初一1班':  [11.2, 9.6, 19.5, 85.5, 21.8, 12.5, 87.5, 78.5, 33.3, 8.3, 23.9, 5.6],
    '初一2班':  [11.2, 77.6, 92.5, 15.5, 8.8, 21.5, 58.5, 70.5, 31.3, 38.3, 23.9, 9.9]
}

var lineChartRenderData = [{
                name: '全校',
                data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
            },{
                name: '初一1班',
                data: [11.2, 9.6, 19.5, 85.5, 21.8, 12.5, 87.5, 78.5, 33.3, 8.3, 23.9, 5.6]
            }];


let td_averageScoreRate = {
    ths: [
        '总分','语文', '数学', '英语'
    ],
    tds: [
        ['全部', 0.8, 0.8, 0.8, 0.9,0.8, 0.8, 0.8, 0.9],
        ['初一1班', 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7],
        ['初一2班', 0.6, 0.6, 0.6, 0.6, 0.7, 0.7, 0.7, 0.7],
        ['初一3班', 0.78, 0.78, 0.78, 0.78, 0.7, 0.7, 0.7, 0.7]
    ]
}

let td_subjectAveScoreRate = {
    ths : [
        '班级', '总分', '语文', '数学','英语', '化学'
    ],
    tds: [
        ['一班', 0.8, 0.7, 0.6, 0.5, 0.78],
        ['二班', 0.8, 0.6, 0.5, 0.9, 0.88],
        ['三班', 0.8, 0.6, 0.5, 0.9, 0.88],
        ['四班', 0.23, 0.43, 0.32, 0.68, 0.87],
        ['五班', 0.78, 0.62, 0.48, 0.7, 0.9]
    ]
}

let td_scoreGroup = {
    ths: [
      '班级', '第一组[0, 106]', '第二组[106,305]', '第三组[305,420]', '第四组[420, 480]', '第五组[480,540]','第六组[540, 610]',
      '第七组[610,690]', '第八组[610,690]','第九组[690, 750]'
    ],
    tds: [
        ['全校', 203, 346, 465, 203, 334, 203, 346, 465, 203],
        ['1班', 203, 346, 465, 203, 334, 203, 346, 465, 203],
        ['2班', 203, 346, 465, 203, 334, 203, 346, 465, 203],
        ['3班', 203, 346, 465, 203, 334, 203, 346, 465, 203]
    ]
}

 */
