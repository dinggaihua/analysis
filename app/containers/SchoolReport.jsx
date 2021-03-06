/*
1.总分分档分析的说明就是按照dis1--即人数来算，而不是靠离差结果那么麻烦
2.学科考试表现第一个文案的计算方法：
    各个学科的平均得分率；某学科中最大班级的平均得分率减去最小班级的平均得分率（其实就是max-min的差值）
3.学科考试表现第二个文案不再计算了
 */

import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Radium from 'radium';
import {Map, List} from 'immutable';
import { Link } from 'react-router';

import CommonErrorView from '../common/ErrorView';
import CommonLoadingView from '../common/LoadingView';
import Header from '../components/schoolReport/Header';
import FullScoreTrend from '../components/schoolReport/FullScoreTrend';
import ScoreDistribution from '../components/schoolReport/ScoreDistribution';
import SubjectDistribution from '../components/schoolReport/SubjectDistribution';
import ClassPerformance from '../components/schoolReport/ClassPerformance';
import SubjectPerformance from '../components/schoolReport/SubjectPerformance';
import GroupAnalysis from '../components/schoolReport/GroupAnalysis';
import StudentPerformance from '../components/schoolReport/StudentPerformance/StudentPerformance';;

import {initReportDSAction, changeLevelAction, updateLevelBuffersAction, saveBaselineAction, disableHaveInitAction} from '../reducers/reportDS/actions';
import {initParams} from '../lib/util';
import {SUBJECTS_WEIGHT as subjectWeight, COLORS_MAP as colorsMap, BACKGROUND_COLOR} from '../lib/constants';
import Spinkit from '../common/Spinkit';

class NavHeader extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var {examId, grade} = this.props;
        var queries = grade ? {examid: examId, grade: grade} : {examid: examId}
        var examInfo = this.props.examInfo.toJS();
        return (
            <div style={{ height: 40, lineHeight: '40px', backgroundColor: '#EFF1F4', margin: '10px auto 10px 0', fontSize: 16, color: colorsMap.C12 }}>
                <span style={localStyle.titleName}><i className='icon-fanhui2' style={{ color: '#59bde5' }}></i></span>
                <span style={{ fontSize: 14, color: '#333', marginLeft: 20 }}>
                    <Link to={{ pathname: '/dashboard',  query: queries}} style={{color: '#b4b4b4'}}>{examInfo.name}</Link>
                    <span><i className='icon-right-open-2'></i>校级分析报告</span>
                </span>
            </div>
        )
    }
}

//TODO:重构成ContentView的组织方式
class SchoolReport extends React.Component {
    static need = [
        initReportDSAction
    ];

    // componentWillMount() {
    //   console.log(this.props.reportDS.haveInit);
    //   debugger;
    // }

    componentDidMount() {
        debugger;
        if(this.props.reportDS.haveInit) return;
        var params = initParams({ 'request': window.request }, this.props.params, this.props.location);
        this.props.initReportDS(params);
        debugger;
    }

//Hack -- 原则上应该是willUnmount的时候对应状态树会被销毁--从而haveInit会被重置为false，但是并没有，所以在Unmount的时候重置haveInit为false。有点像之前为了解决rerender而设置的forceUpdate---为什么没有触发change？是因为生命周期还是有些没有get到？
    // componentWillUnmount() {
    //     // console.log('componentWillUnmount ===================   SchoolReport');
    //     // this.props.reportDS.set('haveInit', false);
    //     this.props.disableHaveInit();
    //     // console.log(this.props.reportDS.haveInit);
    //     debugger;
    // }



    render() {
        var examid = this.props.location.query ? this.props.location.query.examid : '';
        if(!examid) return (<CommonErrorView />);
        var grade = this.props.location.query ? this.props.location.query.grade : '';
        debugger;
        //TOOD:Header那里为什么传入params和location？？？重构
        return (
            <div>
                {(this.props.ifError) ? <CommonErrorView /> : ((this.props.isLoading || !this.props.reportDS.haveInit) ? <Spinkit /> : (
                    <div style={{ width: 1200, margin: '0 auto', marginTop: 20, backgroundColor: BACKGROUND_COLOR, zIndex: 0}}>
                        <NavHeader examInfo={this.props.reportDS.examInfo} examId={examid} grade={grade} />
                        <Header examInfo={this.props.reportDS.examInfo} />
                        <FullScoreTrend reportDS={this.props.reportDS} />
                        <ScoreDistribution reportDS={this.props.reportDS} examId={examid} grade={grade} changeLevels={this.props.changeLevels} saveBaseline={this.props.saveBaseline} />
                        <SubjectDistribution reportDS={this.props.reportDS} />
                        <GroupAnalysis reportDS={this.props.reportDS} examId={examid} grade={grade} updateLevelBuffers={this.props.updateLevelBuffers} saveBaseline={this.props.saveBaseline.bind(this)} />
                        <ClassPerformance reportDS={this.props.reportDS} />
                        <SubjectPerformance reportDS={this.props.reportDS} />
                        <StudentPerformance reportDS={this.props.reportDS} />
                    </div>
                ))}
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        ifError: state.global.ifError,
        isLoading: state.global.isLoading,
        reportDS: state.reportDS
    }
}

function mapDispatchToProps(dispatch) {
    return {
        initReportDS: bindActionCreators(initReportDSAction, dispatch),
        changeLevels: bindActionCreators(changeLevelAction, dispatch),
        updateLevelBuffers: bindActionCreators(updateLevelBuffersAction, dispatch),
        saveBaseline: bindActionCreators(saveBaselineAction, dispatch),
        disableHaveInit: bindActionCreators(disableHaveInitAction, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SchoolReport);

var localStyle = {
    titleName: {
        textDecoration: 'none', display: 'inline-block', width: 10, height: 10
    }
}
/*
Mock Data:
var headerInfo = {
    examName: '遵义县2016年下高二期末考试',
    examTime: '2016.6.12-2016.6.15',
    grade: '初一',
    classNum: 20,
    studentNum: 2300,
    subjectList: ['语文', '数学', '英语', '物理', '化学', '生物']
}

var defaultLevelInfo = [
    {
        score: 520,
        rate: 15,
        num: 100
    },
    {
        score: 480,
        rate: 35,
        num: 360
    },
    {
        score: 360,
        rate: 50,
        num: 890
    }
]


 */



/*


        examInfo = (Map.isMap(examInfo)) ? examInfo.toJS() : examInfo;
        examStudentsInfo = (List.isList(examStudentsInfo)) ? examStudentsInfo.toJS() : examStudentsInfo;
        examPapersInfo = (Map.isMap(examPapersInfo)) ? examPapersInfo.toJS() : examPapersInfo;
        examClassesInfo = (Map.isMap(examClassesInfo)) ? examClassesInfo.toJS() : examClassesInfo;
        studentsGroupByClass = (Map.isMap(studentsGroupByClass)) ? studentsGroupByClass.toJS() : studentsGroupByClass;
        allStudentsPaperMap = (Map.isMap(allStudentsPaperMap)) ? allStudentsPaperMap.toJS() : allStudentsPaperMap;
        headers = (List.isList(headers)) ? headers.toJS() : headers;
        levels = (Map.isMap(levels)) ? levels.toJS() : levels;

        var examid = this.props.location.query ? this.props.location.query.examid : '';
        var grade = this.props.location.query ? this.props.location.query.grade : '';
        if (!examid) return;

        if((!examInfo || _.size(examInfo) == 0) || (!examStudentsInfo || examStudentsInfo.length == 0) ||
            (!examPapersInfo || _.size(examPapersInfo) == 0) || (!examClassesInfo || _.size(examClassesInfo) == 0) ||
            (!studentsGroupByClass || _.size(studentsGroupByClass) == 0) || (!allStudentsPaperMap || _.size(allStudentsPaperMap) == 0) ||
             (!headers || _.size(headers) == 0) || (!levels || _.size(levels) == 0))
             return (
                 <div style={{width: '100%', minHeight: 900, position: 'relative'}}>
                    <Spinkit/>
                 </div>
             )


        var examid = this.props.location.query ? this.props.location.query.examid : '';
        var grade = this.props.location.query ? this.props.location.query.grade : '';

        var {examInfo, examStudentsInfo, examPapersInfo, examClassesInfo, studentsGroupByClass, allStudentsPaperMap, headers} = this.props.reportDS;
        var {levels} = this.props.schoolAnalysis;


 */

// function mapStateToProps(state) {
//     return {
//         haveInit: state.schoolAnalysis.haveInit,
//         examInfo: state.schoolAnalysis.examInfo,
//         examStudentsInfo: state.schoolAnalysis.examStudentsInfo,
//         examPapersInfo: state.schoolAnalysis.examPapersInfo,
//         examClassesInfo: state.schoolAnalysis.examClassesInfo,
//         studentsGroupByClass: state.schoolAnalysis.studentsGroupByClass,
//         allStudentsPaperMap: state.schoolAnalysis.allStudentsPaperMap,
//         headers: state.schoolAnalysis.headers,
//         levels: state.schoolAnalysis.levels,
//         forseUpdate: state.schoolAnalysis.forseUpdate
//     }
// }
