import React, { PropTypes } from 'react';

export default function HeaderInfo({examInfo}) {
    examInfo = examInfo.toJS();
    return (
        <div><h4>HeaderInfo: {examInfo.name}</h4></div>
    )
}
