import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames/bind';
import Radium from 'radium';
import _ from 'lodash';


const ScoreRank = (data) => {

// console.log('scoreRank = ', data.data.top);
    if(!data || !data.data || (_.size(_.keys(data))==0)) return (<div></div>);// 这个时候显示loading动画
    var flag = 0;

    var flagFirstColor = {backgroundColor: '#FF0033'};
    var flagSecondColor = {backgroundColor: '#FF9900'};
    var flagThirdColor = {backgroundColor: '#99CC00'};

    var tops = _.map(data.data.top, function(score, name) {
        flag++;

        var flagColor = {};
        if(flag === 1) {flagColor.first = true};
        if(flag === 2) {flagColor.second = true};
        if(flag === 3) {flagColor.third = true};

        var result = ((flagColor.first && flagFirstColor) || (flagColor.second && flagSecondColor) || (flagColor.third && flagThirdColor));

        return (
            <div key={flag} style={[styles.container, result, styles.common.radius, {marginBottom: 2}]}>
                <div>{name}</div>
                <div>{score}</div>
            </div>
        )
    });
    flag = 0;

    var lows = _.map(data.data.low, function(score, name) {
        flag++;
        return (
            <div key={flag} style={[styles.container, styles.common.radius, {marginBottom: 2}]}>
                <div>{name}</div>
                <div>{score}</div>
            </div>
        )
    });
    return (
        <div style={[styles.item, styles.common.radius, {marginLeft: 20, marginRight: 20}]}>
            <div style={{fontWeight: 'blod', marginTop: 10, marginBottom: 10}}>分数排行榜</div>
            <div style={{flexGrow: 1, display: 'flex'}}>
                <div style={[styles.box, styles.common.radius, {borderRight: 'solid 2px black', marginLeft: 5}]}>
                    {tops}
                </div>
                <div style={[styles.box, styles.common.radius, {marginRight: 5}]}>
                    {lows}
                </div>
            </div>
            <div style={{fontWeight: 'bolder', marginTop: 10, marginBottom: 10, alignSelf: 'flex-end', marginRight: 20}}>查看详情</div>
        </div>
    )
}

export default Radium(ScoreRank);


const styles = {
    common: {
        radius: {
            borderRadius: 15
        }
    },
    item: {height: 320, backgroundColor: '#336699', flexGrow: 1, textAlign: 'center', color: '#ffffff', borderRadius: 15, display: 'flex', flexDirection: 'column'},
    box: {
        flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', backgroundColor: '#999999'
    },
    container: {
        display: 'flex',
        flexWrap: 'nowrap',
        justifyContent: 'space-around'
    }
};
