import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames/bind';
import Radium from 'radium';
import {Link} from 'react-router';
import {Map} from 'immutable';

import CommonErrorView from '../common/ErrorView';
import CommonLoadingView from '../common/LoadingView';
import ReportNavHeader from '../common/report/NavHeader';
import ReportTabNav from '../components/classReport/ReportTabNav';
import MultiClassReport from '../components/classReport/multiClassReport';
import SingleClassReport from '../components/classReport/singleClassReport';

import {initReportDSAction, changeLevelAction, saveBaselineAction} from '../reducers/reportDS/actions';

import {initParams} from '../lib/util';

import {COLORS_MAP as colorsMap} from '../lib/constants';

/*
设计：
    1.一层一层往下拆分；遵从树状组织
    2.数据结构走schoolReprot--TODO:重构成report通用的
 */

/*
设计：1.将className设置成SingleClassReport的state

 */


class ContentComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            reportType: 'single'
        };
    }

    changeClassReport(type) {
        console.log('type == ', type);
        this.setState({
            reportType: type
        })
    }

    render() {
        var isSchoolManagerOrGradeManager = true;//TODO: 替换真实的判断
        var examName = this.props.reportDS.examInfo.toJS().name;
        var user = (Map.isMap(this.props.user)) ? this.props.user.toJS() : this.props.user;

        return (
            <div style={{ width: 1200, margin: '0 auto', marginTop: 20, backgroundColor: colorsMap.A02, zIndex: 0}}>
                <ReportNavHeader examName={examName} examid={this.props.examid} grade={this.props.grade} />
                {(isSchoolManagerOrGradeManager) ? <ReportTabNav changeClassReport={this.changeClassReport.bind(this)} reportDS={this.props.reportDS} /> : ''}
                {(this.state.reportType == 'multi') ? <MultiClassReport reportDS={this.props.reportDS} /> 
                    : <SingleClassReport 
                        reportDS={this.props.reportDS} user={user} grade={this.props.grade} examid={this.props.examid}
                        changeLevels={this.props.changeLevels} saveBaseline={this.props.saveBaseline}/>}
            </div>
        );
    }
}

class ClassReport extends React.Component {
    static need = [
        initReportDSAction
    ]

    componentDidMount() {
        if (this.props.reportDS.haveInit) return;
        var params = initParams({ 'request': window.request }, this.props.params, this.props.location);
        this.props.initReportDS(params);
    }

    render() {
        var examid = this.props.location.query ? this.props.location.query.examid : '';
        var grade = this.props.location.query ? this.props.location.query.grade : '';
        if (!examid) return;

        return (
            <div>
                {(this.props.ifError) ? <CommonErrorView /> : ((this.props.isLoading || !this.props.reportDS.haveInit) ? <CommonLoadingView /> : (
                    <ContentComponent reportDS={this.props.reportDS} user={this.props.user} examid={examid} grade={grade} changeLevels={this.props.changeLevels} saveBaseline={this.props.saveBaseline}/>
                ))}
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ClassReport);

function mapStateToProps(state) {
    return {
        isLoading: state.global.isLoading,
        ifError: state.global.ifError,
        user: state.global.user,
        reportDS: state.reportDS
    }
}

function mapDispatchToProps(dispatch) {
    return {
        initReportDS : bindActionCreators(initReportDSAction, dispatch),
        changeLevels: bindActionCreators(changeLevelAction, dispatch),
        saveBaseline: bindActionCreators(saveBaselineAction, dispatch)
    }
}



//=================================================  分界线  =================================================
