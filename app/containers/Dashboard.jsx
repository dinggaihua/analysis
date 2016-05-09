'use strict';

import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {Link, browserHistory} from 'react-router';
import classNames from 'classnames/bind';
import Radium from 'radium';
import _ from 'lodash';

import ExamGuideComponent from '../components/dashboard/exam-guide';
import ScoreRank from '../components/dashboard/score-rank';
import LevelReport from '../components/dashboard/level-report';
import ClassReport from '../components/dashboard/class-report';
import SubjectReport from '../components/dashboard/subject-report';

import {initDashboardAction} from '../reducers/dashboard/actions';
import {convertJS, initParams} from '../lib/util';

import {Map, List} from 'immutable';


// 　Bgcolor:″＃F1FAFA″——做正文的背景色好，淡雅
// 　　Bgcolor:″＃E8FFE8″——做标题的背景色较好，与上面的颜色搭配很协调
// 　　Bgcolor:″＃E8E8FF″——做正文的背景色较好，文字颜色配黑色
// 　　Bgcolor:″＃8080C0″——上配黄色白色文字较好
// 　　Bgcolor:″＃E8D098″——上配浅蓝色或蓝色文字较好
// 　　Bgcolor:″＃EFEFDA″——上配浅蓝色或红色文字较好
// 　　Bgcolor:″＃F2F1D7″——配黑色文字素雅，如果是红色则显得醒目
// 　　
// 　　
// 　　Bgcolor:″＃336699″——配白色文字好看些  -- 蓝色
// 　　
// 　　
// 　　Bgcolor:″＃6699CC″——配白色文字好看些，可以做标题
// 　　Bgcolor:″＃66CCCC″——配白色文字好看些，可以做标题
// 　　Bgcolor:″＃B45B3E″——配白色文字好看些，可以做标题
// 　　Bgcolor:″＃479AC7″——配白色文字好看些，可以做标题
// 　　Bgcolor:″＃00B271″——配白色文字好看些，可以做标题
// 　　Bgcolor:″＃FBFBEA″——配黑色文字比较好看，一般作为正文
// 　　Bgcolor:″＃D5F3F4″——配黑色文字比较好看，一般作为正文
// 　　Bgcolor:″＃D7FFF0″——配黑色文字比较好看，一般作为正文
// 　　Bgcolor:″＃F0DAD2″——配黑色文字比较好看，一般作为正文
// 　　Bgcolor:″＃DDF3FF″——配黑色文字比较好看，一般作为正文

//   #f5f5dc   #ffe4c4

@Radium
class Dashboard extends React.Component {
    static need = [
        initDashboardAction
    ];

    componentDidMount() {
        if(this.props.dashboard.haveInit) return;

        var params = initParams(this.props.params, this.props.location, {'request': window.request});
        this.props.initDashboard(params);
    }

    toViewSchoolAnalysis() {
        var examid = this.props.location.query ? this.props.location.query.examid : '';
        var grade = this.props.location.query ? this.props.location.query.grade : '';
        if(!examid || !grade) return;
        browserHistory.push('/school/report?examid=' + examid + '&grade=' + encodeURI(grade));
    }

    render() {
        var examGuide = (Map.isMap(this.props.dashboard.examGuide)) ? this.props.dashboard.examGuide.toJS() : this.props.dashboard.examGuide;
        var scoreRank = (Map.isMap(this.props.dashboard.scoreRank)) ? this.props.dashboard.scoreRank.toJS() : this.props.dashboard.scoreRank;
        var levelReport = (Map.isMap(this.props.dashboard.levelReport)) ? this.props.dashboard.levelReport.toJS() : this.props.dashboard.levelReport;
        // var classReport = (Map.isMap(this.props.dashboard.classReport)) ? this.props.dashboard.classReport.toJS() : this.props.dashboard.classReport;
        // var subjectReport = (Map.isMap(this.props.dashboard.subjectReport)) ? this.props.dashboard.subjectReport.toJS() : this.props.dashboard.subjectReport;


        if((!examGuide || _.size(examGuide) == 0) || (!scoreRank || _.size(scoreRank) == 0) ||
            (!levelReport || _.size(levelReport) == 0)) return (<div></div>);

        return (
            <div style={[styles.box, styles.common.radius]}>
                <div style={[styles.container, styles.common.radius]}>
                    <ExamGuideComponent data={examGuide} />
                    <ScoreRank data={scoreRank} />
                    <div key="test" style={[styles.item, styles.common.radius]} onClick={this.toViewSchoolAnalysis.bind(this)}>
                        <div style={{fontWeight: 'blod', marginTop: 10}}>学校成绩总报告</div>
                    </div>
                </div>
                <div style={[styles.container, styles.common.radius]}>
                    <LevelReport data={levelReport} />
                    <div style={[styles.item, styles.common.radius, {marginLeft: 20, marginRight: 20}]}>
                        <div style={{fontWeight: 'blod', marginTop: 10}}>班级分析报告</div>
                    </div>
                    <div style={[styles.item, styles.common.radius]}>
                        <div style={{fontWeight: 'blod', marginTop: 10}}>学科分析报告</div>
                    </div>
                </div>
                <div style={[styles.container, styles.common.radius]}>
                    <div style={[styles.item, styles.common.radius]}>
                        <div style={{fontWeight: 'blod', marginTop: 10}}>学生个人报告</div>
                    </div>
                    <div style={[styles.item, styles.common.radius, {marginLeft: 20, marginRight: 20}]}>
                        <div style={{fontWeight: 'blod', marginTop: 10}}>知识点分析情况</div>
                    </div>
                    <div style={[styles.item, styles.common.radius]}>
                        <div style={{fontWeight: 'blod', marginTop: 10}}>试卷质量分析</div>
                    </div>
                </div>
                <div style={[styles.container, styles.common.radius]}>
                    <div style={[styles.item, styles.common.radius]}>
                        <div style={{fontWeight: 'blod', marginTop: 10}}>试卷讲评</div>
                    </div>
                    <div style={[styles.item, styles.common.radius, {marginLeft: 20, marginRight: 20}]}>
                        <div style={{fontWeight: 'blod', marginTop: 10}}>老师个人报告</div>
                    </div>
                    <div style={[styles.item, styles.common.radius]}>
                        <div style={{fontWeight: 'blod', marginTop: 10}}>考试总成绩</div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);

function mapStateToProps(state) {
    return {
        dashboard: state.dashboard
    }
}

function mapDispatchToProps(dispatch) {
    return {
        initDashboard: bindActionCreators(initDashboardAction, dispatch)
    }
}

var styles = {
    common: {
        radius: {
            borderRadius: 15
        }
    },
    box: {height: 1500, backgroundColor: '#f5f5dc', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', margin: 30},
    container: {height: 300, marginLeft: 10, marginRight: 10, display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'nowrap'},
    item: {height: 320, backgroundColor: '#336699', flexGrow: 1, textAlign: 'center', color: '#ffffff', borderRadius: 15},
    scalZoom: {
        ':hover': {
            backgroundColor: 'black'
        }
        // transitionProperty: '',
        // transitionDuration: '',
        // transitionTimingFunction: ''
    }
}


// .grow { transition: all .2s ease-in-out; }
// .grow:hover { transform: scale(1.1); }
