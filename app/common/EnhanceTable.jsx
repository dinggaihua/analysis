
import React from 'react';
import commonClassName from './common.css';
import _ from 'lodash';
import {Table as BootTable, Popover, OverlayTrigger} from 'react-bootstrap';
import {COLORS_MAP as colorsMap} from '../lib/constants';
import Tip from './Tip';

var tableData = {

    headers: [[{id: 'class', name: '班级', rowSpan: 2}, {name: '一档', colSpan: 2}], [{id: 'ave_class', name: '班级平均分'}, {id: 'ave_grade', name: '年级平均分'}]],
    data: [{class: '1班', ave_class: 110, ave_grade:110}, {class: '2班', ave_class: 111, ave_grade:111}, {class: '3班', ave_class: 120, ave_grade:120}]
}
//有的表头是不需要id的，因为没有数据与之对应
var headers = [[{id: 'class', name: '班级', rowSpan: 2}, {name: '一档', colSpan: 2}], [{id: 'ave_class', name: '班级平均分'}, {id: 'ave_grade', name: '年级平均分'}]];
var data = [{class: '1班', ave_class: 110, ave_grade:110}, {class: '2班', ave_class: 111, ave_grade:111}, {class: '3班', ave_class: 120, ave_grade:120}];
var headerStyle = {backgroundColor: colorsMap.C02}
var defaultSortId= '';
var defaultSortOrder = 'desc';
var tableSortable = true;

// 钻取数据表现样式
const popoverFactory = ({title, content}) => {
    return (
        <Popover id='popover' title={title}>
            {content}
        </Popover>
    )
}

// 表格排序时的箭头样式
const SortDirection = ({sortInfo, id}) => {
    var sortInfo = sortInfo ? sortInfo : {};
    return (
        <span style={localStyle.sortDirection}>
            <div className='dropup' style={_.assign({}, { width: 8, height: '40%', cursor: 'pointer' }, sortInfo.id !== id ? { visibility: 'visible', color: '#dcdcdc' } : sortInfo.order === 'asc' ? { visibility: 'visible', color: '#333' } : { visibility: 'hidden' }) }>
                <span className='caret' style={{ width: '100%' }} ></span>
            </div>
            <div className='dropdown' style={_.assign({}, { width: 8, height: '40%', cursor: 'pointer' }, sortInfo.id !== id ? { visibility: 'visible', color: '#dcdcdc' } : sortInfo.order === 'desc' ? { visibility: 'visible', color: '#333' } : { visibility: 'hidden' }) }>
                <span className='caret' style={{ width: '100%' }}></span>
            </div>
        </span>
    )
}
/**
 * - props：
    - id： String，如果需要下载，则这个值必须设置。
    - tableHeaders: 可能包含多个列表的列表。内含的列表单元表示一行表头。形式：
        - id、name：表头的基本信息。如果tabledata中没有数据和某个表头相对应，则不需要id。
        - columnSortable: Bool, 表示某一列是否能够排序，针对该列。该列有id值才可以排序。默认false。
        - columnStyle: Object或者Function，返回单元格的样式（Object），作用在该列的td上。
            - 如果是Function，传入参数是： cell（单元格数据）, rowData（行数据）, rowIndex（行次序）, columnIndex（列次序）, id（当前数据的id）, tableData(全部表格数据)。
            - 注意：cell有可能是对象（当存在overlayData时),此时数值数据应该存在‘value’属性中；
        - headerStyle:Object或者Function, 作用在具体的th上；
        - dataFormat: Function, 传入参数是 cell（单元格数据）, rowData（表格整体数据）。
            - 注意：cell有可能是对象（当存在overlayData时）,此时数值数据应该从‘value’属性中读取。
        - tipContent：String, 非undefined则表示要显示tip
        - rowSpan
        - colSpan
    - tableData：对象列表，形式如： [{id1: data1, id2: data2 ...}, {id1: data1, id2: data2...}, ...], 每个对象表示表格中的一行, 此处的id对应tableHeaders中的id。
            - 每个属性下除了数值，还可以添加 overLayData:{”title”:, ‘content’:’’}，使鼠标移过该数据时显示悬浮窗。数据组织方式：相应的数值放在value属性里。例如：{a: 1, b: {value: 2, overLayData: {title: '学生名单’, content: ‘王二小，李思， 张三'} }}
            - 可以指定某个td的colSpan\rowSpan， 此时格式为 {id值: {value: , colSpan\rowSpan: }}

    - bordered（默认有边框）、striped(表格行背景颜色交替的效果)、hover；
    - headerStyle , Object（作用在表头的tr元素上）
    - options
        - defaultSortId: 默认排序的表头id
        - defaultSortOrder： 默认排序的表头的排序顺序，若没有指定，默认是’asc’。
        - canDownload: Bool,是否可以下载表格，若是，则表格右上角会显示下载按钮；
        - downLoadBtnStyle: Object, 下载按钮的具体样式.
        - fileName: String，下载文件的名字，不带后缀名。默认叫“tableExport”；
        - worksheetName: excel工作表的名字， 默认为xlsWorksheetName；
        - overlayProps:  {placement: ‘’, trigger: ''}
            - placement: 可以选 'top','right', 'bottom',’left’， 默认是’right'
            - trigger：默认是’hover’ + ‘focus’（两者得并存，否则会会有警报），还可以选择’click’表示点击后触发popover；
    - tableSortable ： Bool， 针对全部表头，是否能排序。如果表头配置里没有id，则不能排序。
 */
class Table extends React.Component {
    constructor(props){
        super(props);
        if (this.props.options){
            var {defaultSortId, defaultSortOrder} = this.props.options;
        }
        this.columnStyles = {}; // 记录具体某一列传入的样式Object || Function，渲染td的时候用到。格式： {id: columnStyle}
        this.dataFormats = {};  // 记录某一列的数据格式化函数， 格式： {id: dataFormatFunction}
        this.state = {
            showData: this.props.tableData,
            sortInfo: defaultSortId ? (defaultSortOrder ? {id: defaultSortId, order: defaultSortOrder}: {id: defaultSortId, order: 'asc'}) :{}             //{id: , order: }
        }
        var {options} = this.props;
        if (options && options.canDownload) {
            this.loadTableExportMethod()
        }

    }
    componentWillMount() {
        if (!_.isEmpty(this.state.sortInfo)) {
            this.setState({
                showData: _.orderBy(this.state.showData, [this.state.sortInfo.id], [this.state.sortInfo.order])
            })
        }
    }
    componentWillReceiveProps(nextProps) {
        var {sortInfo} = this.state;
        var showData = !_.isEmpty(sortInfo) ? _.orderBy(nextProps.tableData, [sortInfo.id], [sortInfo.order]) : nextProps.tableData;

        this.setState({
            showData: showData
        })
    }
    onSortColumn(id, event) {
        if (id === undefined) return ;
        // ---------------
        var {sortInfo} = this.state;
        var newSortInfo = {};
        newSortInfo.id = id;
        if (sortInfo.id === id) {
            newSortInfo.order = sortInfo.order === 'asc' ? 'desc' : 'asc';
        } else {
            newSortInfo.order = 'desc';
        }

        this.setState({
            sortInfo: newSortInfo,
            showData: _.orderBy(this.state.showData, [newSortInfo.id], [newSortInfo.order])
        })

    }
    downLoadTable() {
        var {options, id} = this.props;
        if (!id || !options.canDownload) return ;
        $.when(this.props.onDownloadTable())
         .done(()=>{
             $('#' + id).tableExport({type: 'excel', fileName: options.fileName ? options.fileName : '表格下载', worksheetName: options.worksheetName ? options.worksheetName : 'xlsWorksheetName'});
         })

    }
    render() {
        var headSeq = [];
        var {id, tableHeaders, tableData, data, bordered, striped, hover, headerStyle, options, tableSortable, style, canDownload, ifCanSort} = this.props;
        bordered = bordered === undefined ? true : bordered;
        return (
            <div style={_.assign({}, {position: 'relative'}, style ? style : {})}>
                {
                    options && options.canDownload ? (
                        <div style={_.assign({},{position: 'absolute', right: 0, top: -55, width: 70, height: 30, lineHeight: '30px', textAlign: 'center', background: colorsMap.B03, color: '#fff', cursor: 'pointer',borderRadius: 2}, options.downLoadBtnStyle ? options.downLoadBtnStyle : {} )}
                             onClick={this.downLoadTable.bind(this)}
                            >下载表格</div> ): ''
                }
                <BootTable id={id} responsive striped={striped} bordered={bordered} hover={hover} style={_.assign({}, {marginBottom: 0, borderCollapse:'collapse'}, bordered ? {}:{border:'none'})}>
                    <thead>
                    {
                        _.map(tableHeaders, (headerList, trindex) => {
                            return (
                                <tr key={'thead-tr-' + trindex} style={_.assign({},headerStyle ? headerStyle : { backgroundColor: colorsMap.C02}, bordered ? {} : {border: 'none'})}>
                                    {
                                        _.map(headerList, (header, thindex) => {
                                            if (header.id !== undefined) {
                                                headSeq.push(header.id);
                                            }
                                            if (header.columnStyle !== undefined && this.columnStyles[header.id] === undefined) {
                                                this.columnStyles[header.id] = header.columnStyle;
                                            }
                                            if (header.dataFormat !== undefined && this.dataFormats[header.id] === undefined) {
                                                this.dataFormats[header.id] = header.dataFormat;
                                            }
                                            var headerCss = {};
                                            if (header.headerStyle !== undefined) {
                                                if (_.isFunction(header.headerStyle)) {
                                                    headerCss = header.headerStyle(header.id, header);
                                                } else {
                                                    headerCss = header.headerStyle;
                                                }
                                                headerCss = headerCss === undefined ? {} : headerCss;
                                            }
                                            var sortable = (tableSortable === true && header.id !== undefined && header.columnSortable !== false || header.columnSortable === true) || ifCanSort;
                                            return (
                                                <th key={'thead-th-' + thindex}
                                                    className={commonClassName['table-unit']}
                                                    rowSpan={header.rowSpan ? header.rowSpan : 1}
                                                    colSpan={header.colSpan ? header.colSpan : 1}
                                                    style={_.assign({}, { minWidth: 100, borderColor: colorsMap.C04, position: 'relative', whiteSpace: 'nowrap', fontWeight: 'normal'}, headerCss, sortable ? {cursor: 'pointer'}: {}, bordered ? {}:{border: 'none'})}
                                                    onClick={this.onSortColumn.bind(this, sortable ? header.id : undefined)}
                                                    >
                                                    <span style={header.tipContent !== undefined ? {marginRight: 5} : {}}>{header.name}</span>
                                                    {header.tipContent !== undefined ? (
                                                        <OverlayTrigger
                                                            placement={'bottom'}
                                                            trigger={['hover', 'focus']}
                                                            overlay={popoverFactory({title: '', content: header.tipContent})}
                                                            >
                                                            <div style={{display: 'inline-block', width: 16, height: 16, lineHeight: '16px', borderRadius: '50%', textAlign: 'center', color: '#fff', backgroundColor: colorsMap.C08}}>
                                                                <i className='icon-help-1'></i>
                                                            </div>
                                                        </OverlayTrigger> ): ''}
                                                    {sortable? <SortDirection sortInfo={this.state.sortInfo} id={header.id}/> : ''}
                                                </th>
                                            )
                                        })
                                    }
                                </tr>
                            )

                        })
                    }
                    </thead>
                    <tbody>
                    {
                        _.map(this.state.showData, (rowData, trindex) => {
                            return (
                                <tr key={'tbody-tr-' + trindex} style={_.assign({}, bordered ? {} : {border: 'none'})}>
                                    {
                                        _.map(headSeq, (id, tdindex) => {
                                            var tdStyle = {};
                                            if (this.columnStyles[id]) {
                                                if (_.isFunction(this.columnStyles[id])) {
                                                    tdStyle = this.columnStyles[id](rowData[id], rowData, trindex, tdindex, id, tableData);
                                                } else {
                                                    tdStyle = this.columnStyles[id];
                                                }
                                                tdStyle = tdStyle === undefined ? {} : tdStyle;
                                            }

                                            var dataFormat = rowData[id]; //dataFormat有可能是一个对象，若是，则数值应该从value属性获取；
                                            if (dataFormat === undefined) return;
                                            if (this.dataFormats[id] !== undefined) {
                                                dataFormat = this.dataFormats[id](dataFormat, rowData);
                                            } else {
                                                dataFormat = _.isObject(dataFormat) ? dataFormat.value : dataFormat;
                                            }

                                            var hasOverlayProps = options && options.overlayProps;

                                            return (
                                                <td key={'tbody-td-' + tdindex}
                                                    className={commonClassName['table-unit']}
                                                    colSpan={rowData[id].colSpan ? rowData[id].colSpan : 1}
                                                    rowSpan={rowData[id].rowSpan ? rowData[id].rowSpan : 1}
                                                    style={_.assign({}, { minWidth: 100, borderColor: colorsMap.C04, whiteSpace: 'nowrap'}, tdStyle, bordered ? {}:{border: 'none'}) }
                                                    >
                                                    {
                                                        rowData[id]['overlayData'] !== undefined ? (
                                                            <OverlayTrigger
                                                                placement={hasOverlayProps && options.overlayProps.placement ? options.overlayProps.placement : 'right'}
                                                                trigger={hasOverlayProps &&  options.overlayProps.trigger? options.overlayProps.trigger : ['hover', 'focus']}
                                                                overlay={popoverFactory({title: rowData[id]['overlayData'].title ? rowData[id]['overlayData'].title : '', content: rowData[id]['overlayData'].content ? rowData[id]['overlayData'].content : ''})}
                                                                >
                                                                <span style={{cursor: 'pointer'}}>{dataFormat}</span>
                                                            </OverlayTrigger>
                                                        ) : dataFormat
                                                    }
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
            </div>
        )
    }

    loadTableExportMethod() {

        if ($.fn && !$.fn.tableExport) {
            $('body').append("<script type='text/javascript' src='/plugins/tableExport/libs/FileSaver/FileSaver.min.js'></script>");
            $.fn.extend({
                tableExport: function (options) {
                    var defaults = {
                        consoleLog: false,
                        csvEnclosure: '"',
                        csvSeparator: ',',
                        csvUseBOM: true,
                        displayTableName: false,
                        escape: false,
                        excelstyles: [], // e.g. ['border-bottom', 'border-top', 'border-left', 'border-right']
                        fileName: 'tableExport',
                        htmlContent: false,
                        ignoreColumn: [],
                        ignoreRow: [],
                        jsonScope: 'all', // head, data, all
                        jspdf: {
                            orientation: 'p',
                            unit: 'pt',
                            format: 'a4', // jspdf page format or 'bestfit' for autmatic paper format selection
                            margins: { left: 20, right: 10, top: 10, bottom: 10 },
                            autotable: {
                                styles: {
                                    cellPadding: 2,
                                    rowHeight: 12,
                                    fontSize: 8,
                                    fillColor: 255,        // color value or 'inherit' to use css background-color from html table
                                    textColor: 50,         // color value or 'inherit' to use css color from html table
                                    fontStyle: 'normal',   // normal, bold, italic, bolditalic or 'inherit' to use css font-weight and fonst-style from html table
                                    overflow: 'ellipsize', // visible, hidden, ellipsize or linebreak
                                    halign: 'left',        // left, center, right
                                    valign: 'middle'       // top, middle, bottom
                                },
                                headerStyles: {
                                    fillColor: [52, 73, 94],
                                    textColor: 255,
                                    fontStyle: 'bold',
                                    halign: 'center'
                                },
                                alternateRowStyles: {
                                    fillColor: 245
                                },
                                tableExport: {
                                    onAfterAutotable: null,
                                    onBeforeAutotable: null,
                                    onTable: null
                                }
                            }
                        },
                        numbers: {
                            html: {
                                decimalMark: '.',
                                thousandsSeparator: ','
                            },
                            output: {
                                decimalMark: '.',
                                thousandsSeparator: ','
                            }
                        },
                        onCellData: null,
                        onCellHtmlData: null,
                        outputMode: 'file',  // 'file', 'string' or 'base64'
                        tbodySelector: 'tr',
                        tfootSelector: 'tr', // set empty ('') to prevent export of tfoot rows
                        theadSelector: 'tr',
                        tableName: 'myTableName',
                        type: 'csv', // 'csv', 'txt', 'sql', 'json', 'xml', 'excel', 'doc', 'png' or 'pdf'
                        worksheetName: 'xlsWorksheetName'
                    };

                    var FONT_ROW_RATIO = 1.15;
                    var el = this;
                    var DownloadEvt = null;
                    var $hrows = [];
                    var $rows = [];
                    var rowIndex = 0;
                    var rowspans = [];
                    var trData = '';
                    var colNames = [];

                    $.extend(true, defaults, options);

                    colNames = GetColumnNames(el);

                    if (defaults.type == 'csv' || defaults.type == 'txt') {

                        var csvData = "";
                        var rowlength = 0;
                        rowIndex = 0;

                        function CollectCsvData(tgroup, tselector, rowselector, length) {

                            $rows = $(el).find(tgroup).first().find(tselector);
                            $rows.each(function () {
                                trData = "";
                                ForEachVisibleCell(this, rowselector, rowIndex, length + $rows.length,
                                    function (cell, row, col) {
                                        trData += csvString(cell, row, col) + defaults.csvSeparator;
                                    });
                                trData = $.trim(trData).substring(0, trData.length - 1);
                                if (trData.length > 0) {

                                    if (csvData.length > 0)
                                        csvData += "\n";

                                    csvData += trData;
                                }
                                rowIndex++;
                            });

                            return $rows.length;
                        }

                        rowlength += CollectCsvData('thead', defaults.theadSelector, 'th,td', rowlength);
                        rowlength += CollectCsvData('tbody', defaults.tbodySelector, 'td', rowlength);
                        if (defaults.tfootSelector.length)
                            CollectCsvData('tfoot', defaults.tfootSelector, 'td', rowlength);

                        csvData += "\n";

                        //output
                        if (defaults.consoleLog === true)
                            console.log(csvData);

                        if (defaults.outputMode === 'string')
                            return csvData;

                        if (defaults.outputMode === 'base64')
                            return base64encode(csvData);

                        try {
                            var blob = new Blob([csvData], { type: "text/" + (defaults.type == 'csv' ? 'csv' : 'plain') + ";charset=utf-8" });
                            saveAs(blob, defaults.fileName + '.' + defaults.type, (defaults.type != 'csv' || defaults.csvUseBOM === false));
                        }
                        catch (e) {
                            downloadFile(defaults.fileName + '.' + defaults.type,
                                'data:text/' + (defaults.type == 'csv' ? 'csv' : 'plain') + ';charset=utf-8,' + ((defaults.type == 'csv' && defaults.csvUseBOM) ? '\ufeff' : ''),
                                csvData);
                        }

                    } else if (defaults.type == 'sql') {

                        // Header
                        rowIndex = 0;
                        var tdData = "INSERT INTO `" + defaults.tableName + "` (";
                        $hrows = $(el).find('thead').first().find(defaults.theadSelector);
                        $hrows.each(function () {
                            ForEachVisibleCell(this, 'th,td', rowIndex, $hrows.length,
                                function (cell, row, col) {
                                    tdData += "'" + parseString(cell, row, col) + "',";
                                });
                            rowIndex++;
                            tdData = $.trim(tdData);
                            tdData = $.trim(tdData).substring(0, tdData.length - 1);
                        });
                        tdData += ") VALUES ";
                        // Row vs Column
                        $rows = $(el).find('tbody').first().find(defaults.tbodySelector);
                        if (defaults.tfootSelector.length)
                            $rows.push($(el).find('tfoot').find(defaults.tfootSelector));
                        $rows.each(function () {
                            trData = "";
                            ForEachVisibleCell(this, 'td', rowIndex, $hrows.length + $rows.length,
                                function (cell, row, col) {
                                    trData += "'" + parseString(cell, row, col) + "',";
                                });
                            if (trData.length > 3) {
                                tdData += "(" + trData;
                                tdData = $.trim(tdData).substring(0, tdData.length - 1);
                                tdData += "),";
                            }
                            rowIndex++;
                        });

                        tdData = $.trim(tdData).substring(0, tdData.length - 1);
                        tdData += ";";

                        //output
                        if (defaults.consoleLog === true)
                            console.log(tdData);

                        if (defaults.outputMode === 'string')
                            return tdData;

                        if (defaults.outputMode === 'base64')
                            return base64encode(tdData);

                        try {
                            var blob = new Blob([tdData], { type: "text/plain;charset=utf-8" });
                            saveAs(blob, defaults.fileName + '.sql');
                        }
                        catch (e) {
                            downloadFile(defaults.fileName + '.sql',
                                'data:application/sql;charset=utf-8,',
                                tdData);
                        }

                    } else if (defaults.type == 'json') {

                        var jsonHeaderArray = [];
                        $hrows = $(el).find('thead').first().find(defaults.theadSelector);
                        $hrows.each(function () {
                            var jsonArrayTd = [];

                            ForEachVisibleCell(this, 'th,td', rowIndex, $hrows.length,
                                function (cell, row, col) {
                                    jsonArrayTd.push(parseString(cell, row, col));
                                });
                            jsonHeaderArray.push(jsonArrayTd);
                        });

                        var jsonArray = [];
                        $rows = $(el).find('tbody').first().find(defaults.tbodySelector);
                        if (defaults.tfootSelector.length)
                            $rows.push($(el).find('tfoot').find(defaults.tfootSelector));
                        $rows.each(function () {
                            var jsonObjectTd = {};

                            var colIndex = 0;
                            ForEachVisibleCell(this, 'td', rowIndex, $hrows.length + $rows.length,
                                function (cell, row, col) {
                                    if (jsonHeaderArray.length) {
                                        jsonObjectTd[jsonHeaderArray[jsonHeaderArray.length - 1][colIndex]] = parseString(cell, row, col);
                                    } else {
                                        jsonObjectTd[colIndex] = parseString(cell, row, col);
                                    }
                                    colIndex++;
                                });
                            if ($.isEmptyObject(jsonObjectTd) == false)
                                jsonArray.push(jsonObjectTd);

                            rowIndex++;
                        });

                        var sdata = "";

                        if (defaults.jsonScope == 'head')
                            sdata = JSON.stringify(jsonHeaderArray);
                        else if (defaults.jsonScope == 'data')
                            sdata = JSON.stringify(jsonArray);
                        else // all
                            sdata = JSON.stringify({ header: jsonHeaderArray, data: jsonArray });

                        if (defaults.consoleLog === true)
                            console.log(sdata);

                        if (defaults.outputMode === 'string')
                            return sdata;

                        if (defaults.outputMode === 'base64')
                            return base64encode(sdata);

                        try {
                            var blob = new Blob([sdata], { type: "application/json;charset=utf-8" });
                            saveAs(blob, defaults.fileName + '.json');
                        }
                        catch (e) {
                            downloadFile(defaults.fileName + '.json',
                                'data:application/json;charset=utf-8;base64,',
                                sdata);
                        }

                    } else if (defaults.type === 'xml') {

                        rowIndex = 0;
                        var xml = '<?xml version="1.0" encoding="utf-8"?>';
                        xml += '<tabledata><fields>';

                        // Header
                        $hrows = $(el).find('thead').first().find(defaults.theadSelector);
                        $hrows.each(function () {

                            ForEachVisibleCell(this, 'th,td', rowIndex, $rows.length,
                                function (cell, row, col) {
                                    xml += "<field>" + parseString(cell, row, col) + "</field>";
                                });
                            rowIndex++;
                        });
                        xml += '</fields><data>';

                        // Row Vs Column
                        var rowCount = 1;
                        $rows = $(el).find('tbody').first().find(defaults.tbodySelector);
                        if (defaults.tfootSelector.length)
                            $rows.push($(el).find('tfoot').find(defaults.tfootSelector));
                        $rows.each(function () {
                            var colCount = 1;
                            trData = "";
                            ForEachVisibleCell(this, 'td', rowIndex, $hrows.length + $rows.length,
                                function (cell, row, col) {
                                    trData += "<column-" + colCount + ">" + parseString(cell, row, col) + "</column-" + colCount + ">";
                                    colCount++;
                                });
                            if (trData.length > 0 && trData != "<column-1></column-1>") {
                                xml += '<row id="' + rowCount + '">' + trData + '</row>';
                                rowCount++;
                            }

                            rowIndex++;
                        });
                        xml += '</data></tabledata>';

                        //output
                        if (defaults.consoleLog === true)
                            console.log(xml);

                        if (defaults.outputMode === 'string')
                            return xml;

                        if (defaults.outputMode === 'base64')
                            return base64encode(xml);

                        try {
                            var blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
                            saveAs(blob, defaults.fileName + '.xml');
                        }
                        catch (e) {
                            downloadFile(defaults.fileName + '.xml',
                                'data:application/xml;charset=utf-8;base64,',
                                xml);
                        }

                    } else if (defaults.type == 'excel' || defaults.type == 'xls' || defaults.type == 'word' || defaults.type == 'doc') {

                        var MSDocType = (defaults.type == 'excel' || defaults.type == 'xls') ? 'excel' : 'word';
                        var MSDocExt = (MSDocType == 'excel') ? 'xls' : 'doc';
                        var MSDocSchema = (MSDocExt == 'xls') ? 'xmlns:x="urn:schemas-microsoft-com:office:excel"' : 'xmlns:w="urn:schemas-microsoft-com:office:word"';
                        var $tables = $(el).filter(function () {
                            return $(this).data("tableexport-display") != 'none' &&
                                ($(this).is(':visible') ||
                                    $(this).data("tableexport-display") == 'always');
                        });
                        var docData = '';

                        $tables.each(function () {
                            rowIndex = 0;

                            colNames = GetColumnNames(this);

                            docData += '<table><thead>';
                            // Header
                            $hrows = $(this).find('thead').first().find(defaults.theadSelector);
                            $hrows.each(function () {
                                trData = "";
                                ForEachVisibleCell(this, 'th,td', rowIndex, $hrows.length,
                                    function (cell, row, col) {
                                        if (cell != null) {
                                            var thstyle = '';
                                            trData += '<th';
                                            for (var styles in defaults.excelstyles) {
                                                if (defaults.excelstyles.hasOwnProperty(styles)) {
                                                    var thcss = $(cell).css(defaults.excelstyles[styles]);
                                                    if (thcss != '' && thcss != '0px none rgb(0, 0, 0)') {
                                                        if (thstyle == '')
                                                            thstyle = 'style="';
                                                        thstyle += defaults.excelstyles[styles] + ':' + thcss + ';';
                                                    }
                                                }
                                            }
                                            if (thstyle != '')
                                                trData += ' ' + thstyle + '"';
                                            if ($(cell).is("[colspan]"))
                                                trData += ' colspan="' + $(cell).attr('colspan') + '"';
                                            if ($(cell).is("[rowspan]"))
                                                trData += ' rowspan="' + $(cell).attr('rowspan') + '"';
                                            trData += '>' + parseString(cell, row, col) + '</th>';
                                        }
                                    });
                                if (trData.length > 0)
                                    docData += '<tr>' + trData + '</tr>';
                                rowIndex++;
                            });

                            docData += '</thead><tbody>';
                            // Row Vs Column
                            $rows = $(this).find('tbody').first().find(defaults.tbodySelector);
                            if (defaults.tfootSelector.length)
                                $rows.push($(el).find('tfoot').find(defaults.tfootSelector));
                            $rows.each(function () {
                                trData = "";
                                ForEachVisibleCell(this, 'td', rowIndex, $hrows.length + $rows.length,
                                    function (cell, row, col) {
                                        if (cell != null) {
                                            var tdstyle = '';
                                            var tdcss = $(cell).data("tableexport-msonumberformat");

                                            if (typeof tdcss == 'undefined' && typeof defaults.onMsoNumberFormat === 'function')
                                                tdcss = defaults.onMsoNumberFormat(cell, row, col);

                                            if (typeof tdcss != 'undefined' && tdcss != '') {
                                                if (tdstyle == '')
                                                    tdstyle = 'style="';
                                                tdstyle = 'style="mso-number-format:\'' + tdcss + '\'';
                                            }

                                            trData += '<td';
                                            for (var styles in defaults.excelstyles) {
                                                if (defaults.excelstyles.hasOwnProperty(styles)) {
                                                    tdcss = $(cell).css(defaults.excelstyles[styles]);
                                                    if (tdcss != '' && tdcss != '0px none rgb(0, 0, 0)') {
                                                        if (tdstyle == '')
                                                            tdstyle = 'style="';
                                                        tdstyle += defaults.excelstyles[styles] + ':' + tdcss + ';';
                                                    }
                                                }
                                            }
                                            if (tdstyle != '')
                                                trData += ' ' + tdstyle + '"';
                                            if ($(cell).is("[colspan]"))
                                                trData += ' colspan="' + $(cell).attr('colspan') + '"';
                                            if ($(cell).is("[rowspan]"))
                                                trData += ' rowspan="' + $(cell).attr('rowspan') + '"';
                                            trData += '>' + parseString(cell, row, col) + '</td>';
                                        }
                                    });
                                if (trData.length > 0)
                                    docData += '<tr>' + trData + '</tr>';
                                rowIndex++;
                            });

                            if (defaults.displayTableName)
                                docData += '<tr><td></td></tr><tr><td></td></tr><tr><td>' + parseString($('<p>' + defaults.tableName + '</p>')) + '</td></tr>';

                            docData += '</tbody></table>';

                            if (defaults.consoleLog === true)
                                console.log(docData);
                        });

                        var docFile = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' + MSDocSchema + ' xmlns="http://www.w3.org/TR/REC-html40">';
                        docFile += '<meta http-equiv="content-type" content="application/vnd.ms-' + MSDocType + '; charset=UTF-8">';
                        docFile += "<head>";
                        if (MSDocType === 'excel') {
                            docFile += "<!--[if gte mso 9]>";
                            docFile += "<xml>";
                            docFile += "<x:ExcelWorkbook>";
                            docFile += "<x:ExcelWorksheets>";
                            docFile += "<x:ExcelWorksheet>";
                            docFile += "<x:Name>";
                            docFile += defaults.worksheetName;
                            docFile += "</x:Name>";
                            docFile += "<x:WorksheetOptions>";
                            docFile += "<x:DisplayGridlines/>";
                            docFile += "</x:WorksheetOptions>";
                            docFile += "</x:ExcelWorksheet>";
                            docFile += "</x:ExcelWorksheets>";
                            docFile += "</x:ExcelWorkbook>";
                            docFile += "</xml>";
                            docFile += "<![endif]-->";
                        }
                        docFile += "</head>";
                        docFile += "<body>";
                        docFile += docData;
                        docFile += "</body>";
                        docFile += "</html>";

                        if (defaults.consoleLog === true)
                            console.log(docFile);

                        if (defaults.outputMode === 'string')
                            return docFile;

                        if (defaults.outputMode === 'base64')
                            return base64encode(docFile);

                        try {
                            var blob = new Blob([docFile], { type: 'application/vnd.ms-' + defaults.type });
                            saveAs(blob, defaults.fileName + '.' + MSDocExt);
                        }
                        catch (e) {
                            downloadFile(defaults.fileName + '.' + MSDocExt,
                                'data:application/vnd.ms-' + MSDocType + ';base64,',
                                docFile);
                        }

                    } else if (defaults.type == 'png') {
                        html2canvas($(el)[0], {
                            allowTaint: true,
                            background: '#fff',
                            onrendered: function (canvas) {

                                var image = canvas.toDataURL();
                                image = image.substring(22); // remove data stuff

                                var byteString = atob(image);
                                var buffer = new ArrayBuffer(byteString.length);
                                var intArray = new Uint8Array(buffer);

                                for (var i = 0; i < byteString.length; i++)
                                    intArray[i] = byteString.charCodeAt(i);

                                if (defaults.consoleLog === true)
                                    console.log(byteString);

                                if (defaults.outputMode === 'string')
                                    return byteString;

                                if (defaults.outputMode === 'base64')
                                    return base64encode(image);

                                try {
                                    var blob = new Blob([buffer], { type: "image/png" });
                                    saveAs(blob, defaults.fileName + '.png');
                                }
                                catch (e) {
                                    downloadFile(defaults.fileName + '.png',
                                        'data:image/png;base64,',
                                        image);
                                }
                            }
                        });

                    } else if (defaults.type == 'pdf') {
                        if (defaults.jspdf.autotable === false) {
                            var addHtmlOptions = {
                                dim: {
                                    w: getPropertyUnitValue($(el).first().get(0), 'width', 'mm'),
                                    h: getPropertyUnitValue($(el).first().get(0), 'height', 'mm')
                                },
                                pagesplit: false
                            };

                            var doc = new jsPDF(defaults.jspdf.orientation, defaults.jspdf.unit, defaults.jspdf.format);
                            doc.addHTML($(el).first(),
                                defaults.jspdf.margins.left,
                                defaults.jspdf.margins.top,
                                addHtmlOptions,
                                function () {
                                    jsPdfOutput(doc);
                                });
                            //delete doc;
                        }
                        else {
                            // pdf output using jsPDF AutoTable plugin
                            // https://github.com/simonbengtsson/jsPDF-AutoTable

                            var teOptions = defaults.jspdf.autotable.tableExport;

                            // When setting jspdf.format to 'bestfit' tableExport tries to choose
                            // the minimum required paper format and orientation in which the table
                            // (or tables in multitable mode) completely fits without column adjustment
                            if (typeof defaults.jspdf.format === 'string' && defaults.jspdf.format.toLowerCase() === 'bestfit') {
                                var pageFormats = {
                                    'a0': [2383.94, 3370.39], 'a1': [1683.78, 2383.94],
                                    'a2': [1190.55, 1683.78], 'a3': [841.89, 1190.55],
                                    'a4': [595.28, 841.89]
                                };
                                var rk = '', ro = '';
                                var mw = 0;

                                $(el).filter(':visible').each(function () {
                                    if ($(this).css('display') != 'none') {
                                        var w = getPropertyUnitValue($(this).get(0), 'width', 'pt');

                                        if (w > mw) {
                                            if (w > pageFormats['a0'][0]) {
                                                rk = 'a0';
                                                ro = 'l';
                                            }
                                            for (var key in pageFormats) {
                                                if (pageFormats.hasOwnProperty(key)) {
                                                    if (pageFormats[key][1] > w) {
                                                        rk = key;
                                                        ro = 'l';
                                                        if (pageFormats[key][0] > w)
                                                            ro = 'p';
                                                    }
                                                }
                                            }
                                            mw = w;
                                        }
                                    }
                                });
                                defaults.jspdf.format = (rk == '' ? 'a4' : rk);
                                defaults.jspdf.orientation = (ro == '' ? 'w' : ro);
                            }

                            // The jsPDF doc object is stored in defaults.jspdf.autotable.tableExport,
                            // thus it can be accessed from any callback function
                            teOptions.doc = new jsPDF(defaults.jspdf.orientation,
                                defaults.jspdf.unit,
                                defaults.jspdf.format);

                            $(el).filter(function () {
                                return $(this).data("tableexport-display") != 'none' &&
                                    ($(this).is(':visible') ||
                                        $(this).data("tableexport-display") == 'always');
                            }).each(function () {
                                var colKey;
                                var rowIndex = 0;

                                colNames = GetColumnNames(this);

                                teOptions.columns = [];
                                teOptions.rows = [];
                                teOptions.rowoptions = {};

                                // onTable: optional callback function for every matching table that can be used
                                // to modify the tableExport options or to skip the output of a particular table
                                // if the table selector targets multiple tables
                                if (typeof teOptions.onTable === 'function')
                                    if (teOptions.onTable($(this), defaults) === false)
                                        return true; // continue to next iteration step (table)

                                // each table works with an own copy of AutoTable options
                                defaults.jspdf.autotable.tableExport = null;  // avoid deep recursion error
                                var atOptions = $.extend(true, {}, defaults.jspdf.autotable);
                                defaults.jspdf.autotable.tableExport = teOptions;

                                atOptions.margin = {};
                                $.extend(true, atOptions.margin, defaults.jspdf.margins);
                                atOptions.tableExport = teOptions;

                                // Fix jsPDF Autotable's row height calculation
                                if (typeof atOptions.beforePageContent !== 'function') {
                                    atOptions.beforePageContent = function (data) {
                                        if (data.pageCount == 1) {
                                            var all = data.table.rows.concat(data.table.headerRow);
                                            all.forEach(function (row) {
                                                if (row.height > 0) {
                                                    row.height += (2 - FONT_ROW_RATIO) / 2 * row.styles.fontSize;
                                                    data.table.height += (2 - FONT_ROW_RATIO) / 2 * row.styles.fontSize;
                                                }
                                            });
                                        }
                                    }
                                }

                                if (typeof atOptions.createdHeaderCell !== 'function') {
                                    // apply some original css styles to pdf header cells
                                    atOptions.createdHeaderCell = function (cell, data) {

                                        // jsPDF AutoTable plugin v2.0.14 fix: each cell needs its own styles object
                                        cell.styles = $.extend({}, data.row.styles);

                                        if (typeof teOptions.columns[data.column.dataKey] != 'undefined') {
                                            var col = teOptions.columns[data.column.dataKey];

                                            if (typeof col.rect != 'undefined') {
                                                var rh;

                                                cell.contentWidth = col.rect.width;

                                                if (typeof teOptions.heightRatio == 'undefined' || teOptions.heightRatio == 0) {
                                                    if (data.row.raw[data.column.dataKey].rowspan)
                                                        rh = data.row.raw[data.column.dataKey].rect.height / data.row.raw[data.column.dataKey].rowspan;
                                                    else
                                                        rh = data.row.raw[data.column.dataKey].rect.height;

                                                    teOptions.heightRatio = cell.styles.rowHeight / rh;
                                                }

                                                rh = data.row.raw[data.column.dataKey].rect.height * teOptions.heightRatio;
                                                if (rh > cell.styles.rowHeight)
                                                    cell.styles.rowHeight = rh;
                                            }

                                            if (typeof col.style != 'undefined' && col.style.hidden !== true) {
                                                cell.styles.halign = col.style.align;
                                                if (atOptions.styles.fillColor === 'inherit')
                                                    cell.styles.fillColor = col.style.bcolor;
                                                if (atOptions.styles.textColor === 'inherit')
                                                    cell.styles.textColor = col.style.color;
                                                if (atOptions.styles.fontStyle === 'inherit')
                                                    cell.styles.fontStyle = col.style.fstyle;
                                            }
                                        }
                                    }
                                }

                                if (typeof atOptions.createdCell !== 'function') {
                                    // apply some original css styles to pdf table cells
                                    atOptions.createdCell = function (cell, data) {
                                        var rowopt = teOptions.rowoptions[data.row.index + ":" + data.column.dataKey];

                                        if (typeof rowopt != 'undefined' &&
                                            typeof rowopt.style != 'undefined' &&
                                            rowopt.style.hidden !== true) {
                                            cell.styles.halign = rowopt.style.align;
                                            if (atOptions.styles.fillColor === 'inherit')
                                                cell.styles.fillColor = rowopt.style.bcolor;
                                            if (atOptions.styles.textColor === 'inherit')
                                                cell.styles.textColor = rowopt.style.color;
                                            if (atOptions.styles.fontStyle === 'inherit')
                                                cell.styles.fontStyle = rowopt.style.fstyle;
                                        }
                                    }
                                }

                                if (typeof atOptions.drawHeaderCell !== 'function') {
                                    atOptions.drawHeaderCell = function (cell, data) {
                                        var colopt = teOptions.columns[data.column.dataKey];

                                        if ((colopt.style.hasOwnProperty("hidden") != true || colopt.style.hidden !== true) &&
                                            colopt.rowIndex >= 0)
                                            return prepareAutoTableText(cell, data, colopt);
                                        else
                                            return false; // cell is hidden
                                    }
                                }

                                if (typeof atOptions.drawCell !== 'function') {
                                    atOptions.drawCell = function (cell, data) {
                                        var rowopt = teOptions.rowoptions[data.row.index + ":" + data.column.dataKey];
                                        if (prepareAutoTableText(cell, data, rowopt)) {

                                            teOptions.doc.rect(cell.x, cell.y, cell.width, cell.height, cell.styles.fillStyle);

                                            if (typeof rowopt != 'undefined' && typeof rowopt.kids != 'undefined' && rowopt.kids.length > 0) {

                                                var dh = cell.height / rowopt.rect.height;
                                                if (dh > teOptions.dh || typeof teOptions.dh == 'undefined')
                                                    teOptions.dh = dh;
                                                teOptions.dw = cell.width / rowopt.rect.width;

                                                drawCellElements(cell, rowopt.kids, teOptions);
                                            }
                                            teOptions.doc.autoTableText(cell.text, cell.textPos.x, cell.textPos.y, {
                                                halign: cell.styles.halign,
                                                valign: cell.styles.valign
                                            });
                                        }
                                        return false;
                                    }
                                }

                                // collect header and data rows
                                teOptions.headerrows = [];
                                $hrows = $(this).find('thead').find(defaults.theadSelector);
                                $hrows.each(function () {
                                    colKey = 0;

                                    teOptions.headerrows[rowIndex] = [];

                                    ForEachVisibleCell(this, 'th,td', rowIndex, $hrows.length,
                                        function (cell, row, col) {
                                            var obj = getCellStyles(cell);
                                            obj.title = parseString(cell, row, col);
                                            obj.key = colKey++;
                                            obj.rowIndex = rowIndex;
                                            teOptions.headerrows[rowIndex].push(obj);
                                        });
                                    rowIndex++;
                                });

                                if (rowIndex > 0) {
                                    // iterate through last row
                                    $.each(teOptions.headerrows[rowIndex - 1], function () {
                                        if (rowIndex > 1 && this.rect == null)
                                            obj = teOptions.headerrows[rowIndex - 2][this.key];
                                        else
                                            obj = this;

                                        if (obj != null)
                                            teOptions.columns.push(obj);
                                    });
                                }

                                var rowCount = 0;
                                $rows = $(this).find('tbody').find(defaults.tbodySelector);
                                if (defaults.tfootSelector.length)
                                    $rows.push($(el).find('tfoot').find(defaults.tfootSelector));
                                $rows.each(function () {
                                    var rowData = [];
                                    colKey = 0;

                                    ForEachVisibleCell(this, 'td', rowIndex, $hrows.length + $rows.length,
                                        function (cell, row, col) {
                                            if (typeof teOptions.columns[colKey] === 'undefined') {
                                                // jsPDF-Autotable needs columns. Thus define hidden ones for tables without thead
                                                var obj = {
                                                    title: '',
                                                    key: colKey,
                                                    style: {
                                                        hidden: true
                                                    }
                                                };
                                                teOptions.columns.push(obj);
                                            }
                                            if (typeof cell !== 'undefined' && cell != null) {
                                                var obj = getCellStyles(cell);
                                                obj.kids = $(cell).children();
                                                teOptions.rowoptions[rowCount + ":" + colKey++] = obj;
                                            }
                                            else {
                                                var obj = $.extend(true, {}, teOptions.rowoptions[rowCount + ":" + (colKey - 1)]);
                                                obj.colspan = -1;
                                                teOptions.rowoptions[rowCount + ":" + colKey++] = obj;
                                            }

                                            rowData.push(parseString(cell, row, col));
                                        });
                                    if (rowData.length) {
                                        teOptions.rows.push(rowData);
                                        rowCount++
                                    }
                                    rowIndex++;
                                });

                                // onBeforeAutotable: optional callback function before calling
                                // jsPDF AutoTable that can be used to modify the AutoTable options
                                if (typeof teOptions.onBeforeAutotable === 'function')
                                    teOptions.onBeforeAutotable($(this), teOptions.columns, teOptions.rows, atOptions);

                                teOptions.doc.autoTable(teOptions.columns, teOptions.rows, atOptions);

                                // onAfterAutotable: optional callback function after returning
                                // from jsPDF AutoTable that can be used to modify the AutoTable options
                                if (typeof teOptions.onAfterAutotable === 'function')
                                    teOptions.onAfterAutotable($(this), atOptions);

                                // set the start position for the next table (in case there is one)
                                defaults.jspdf.autotable.startY = teOptions.doc.autoTableEndPosY() + atOptions.margin.top;
                            });

                            jsPdfOutput(teOptions.doc);

                            if (typeof teOptions.headerrows != 'undefined')
                                teOptions.headerrows.length = 0;
                            if (typeof teOptions.columns != 'undefined')
                                teOptions.columns.length = 0;
                            if (typeof teOptions.rows != 'undefined')
                                teOptions.rows.length = 0;
                            delete teOptions.doc;
                            teOptions.doc = null;
                        }
                    }

                    function FindColObject(objects, colIndex, rowIndex) {
                        var result = null;
                        $.each(objects, function () {
                            if (this.rowIndex == rowIndex && this.key == colIndex) {
                                result = this;
                                return false;
                            }
                        });
                        return result;
                    }

                    function GetColumnNames(table) {
                        var result = [];
                        $(table).find('thead').first().find('th').each(function (index, el) {
                            if ($(el).attr("data-field") !== undefined)
                                result[index] = $(el).attr("data-field");
                            else
                                result[index] = index.toString();
                        });
                        return result;
                    }

                    function isColumnIgnored($row, colIndex) {
                        var result = false;
                        if (defaults.ignoreColumn.length > 0) {
                            if (typeof defaults.ignoreColumn[0] == 'string') {
                                if (colNames.length > colIndex && typeof colNames[colIndex] != 'undefined')
                                    if ($.inArray(colNames[colIndex], defaults.ignoreColumn) != -1)
                                        result = true;
                            }
                            else if (typeof defaults.ignoreColumn[0] == 'number') {
                                if ($.inArray(colIndex, defaults.ignoreColumn) != -1 ||
                                    $.inArray(colIndex - $row.length, defaults.ignoreColumn) != -1)
                                    result = true;
                            }
                        }
                        return result;
                    }

                    function ForEachVisibleCell(tableRow, selector, rowIndex, rowCount, cellcallback) {
                        if ($.inArray(rowIndex, defaults.ignoreRow) == -1 &&
                            $.inArray(rowIndex - rowCount, defaults.ignoreRow) == -1) {

                            var $row = $(tableRow).filter(function () {
                                return $(this).data("tableexport-display") != 'none' &&
                                    ($(this).is(':visible') ||
                                        $(this).data("tableexport-display") == 'always' ||
                                        $(this).closest('table').data("tableexport-display") == 'always');
                            }).find(selector);

                            var rowColspan = 0;
                            var rowColIndex = 0;

                            $row.each(function (colIndex) {
                                if ($(this).data("tableexport-display") == 'always' ||
                                    ($(this).css('display') != 'none' &&
                                        $(this).css('visibility') != 'hidden' &&
                                        $(this).data("tableexport-display") != 'none')) {
                                    if (isColumnIgnored($row, colIndex) == false) {
                                        if (typeof (cellcallback) === "function") {
                                            var c, Colspan = 0;
                                            var r, Rowspan = 0;

                                            // handle rowspans from previous rows
                                            if (typeof rowspans[rowIndex] != 'undefined' && rowspans[rowIndex].length > 0) {
                                                for (c = 0; c <= colIndex; c++) {
                                                    if (typeof rowspans[rowIndex][c] != 'undefined') {
                                                        cellcallback(null, rowIndex, c);
                                                        delete rowspans[rowIndex][c];
                                                        colIndex++;
                                                    }
                                                }
                                            }
                                            rowColIndex = colIndex;

                                            if ($(this).is("[colspan]")) {
                                                Colspan = parseInt($(this).attr('colspan'));
                                                rowColspan += Colspan > 0 ? Colspan - 1 : 0;
                                            }

                                            if ($(this).is("[rowspan]"))
                                                Rowspan = parseInt($(this).attr('rowspan'));

                                            // output content of current cell
                                            cellcallback(this, rowIndex, colIndex);

                                            // handle colspan of current cell
                                            for (c = 0; c < Colspan - 1; c++)
                                                cellcallback(null, rowIndex, colIndex + c);

                                            // store rowspan for following rows
                                            if (Rowspan) {
                                                for (r = 1; r < Rowspan; r++) {
                                                    if (typeof rowspans[rowIndex + r] == 'undefined')
                                                        rowspans[rowIndex + r] = [];

                                                    rowspans[rowIndex + r][colIndex + rowColspan] = "";

                                                    for (c = 1; c < Colspan; c++)
                                                        rowspans[rowIndex + r][colIndex + rowColspan - c] = "";
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                            // handle rowspans from previous rows
                            if (typeof rowspans[rowIndex] != 'undefined' && rowspans[rowIndex].length > 0) {
                                for (let c = 0; c <= rowspans[rowIndex].length; c++) {
                                    if (typeof rowspans[rowIndex][c] != 'undefined') {
                                        cellcallback(null, rowIndex, c);
                                        delete rowspans[rowIndex][c];
                                    }
                                }
                            }
                        }
                    }

                    function jsPdfOutput(doc) {
                        if (defaults.consoleLog === true)
                            console.log(doc.output());

                        if (defaults.outputMode === 'string')
                            return doc.output();

                        if (defaults.outputMode === 'base64')
                            return base64encode(doc.output());

                        try {
                            var blob = doc.output('blob');
                            saveAs(blob, defaults.fileName + '.pdf');
                        }
                        catch (e) {
                            downloadFile(defaults.fileName + '.pdf',
                                'data:application/pdf;base64,',
                                doc.output());
                        }
                    }

                    function prepareAutoTableText(cell, data, cellopt) {
                        var cs = 0;
                        if (typeof cellopt != 'undefined')
                            cs = cellopt.colspan;

                        if (cs >= 0) {
                            // colspan handling
                            var cellWidth = cell.width;
                            var textPosX = cell.textPos.x;
                            var i = data.table.columns.indexOf(data.column);

                            for (var c = 1; c < cs; c++) {
                                var column = data.table.columns[i + c];
                                cellWidth += column.width;
                            }

                            if (cs > 1) {
                                if (cell.styles.halign === 'right')
                                    textPosX = cell.textPos.x + cellWidth - cell.width;
                                else if (cell.styles.halign === 'center')
                                    textPosX = cell.textPos.x + (cellWidth - cell.width) / 2;
                            }

                            cell.width = cellWidth;
                            cell.textPos.x = textPosX;

                            if (typeof cellopt != 'undefined' && cellopt.rowspan > 1)
                                cell.height = cell.height * cellopt.rowspan;

                            // fix jsPDF's calculation of text position
                            if (cell.styles.valign === 'middle' || cell.styles.valign === 'bottom') {
                                var splittedText = typeof cell.text === 'string' ? cell.text.split(/\r\n|\r|\n/g) : cell.text;
                                var lineCount = splittedText.length || 1;
                                if (lineCount > 2)
                                    cell.textPos.y -= ((2 - FONT_ROW_RATIO) / 2 * data.row.styles.fontSize) * (lineCount - 2) / 3;
                            }
                            return true;
                        }
                        else
                            return false; // cell is hidden (colspan = -1), don't draw it
                    }

                    function drawCellElements(cell, elements, teOptions) {
                        elements.each(function () {
                            var kids = $(this).children();

                            if ($(this).is("div")) {
                                var bcolor = rgb2array(getStyle(this, 'background-color'), [255, 255, 255]);
                                var lcolor = rgb2array(getStyle(this, 'border-top-color'), [0, 0, 0]);
                                var lwidth = getPropertyUnitValue(this, 'border-top-width', defaults.jspdf.unit);

                                var r = this.getBoundingClientRect();
                                var ux = this.offsetLeft * teOptions.dw;
                                var uy = this.offsetTop * teOptions.dh;
                                var uw = r.width * teOptions.dw;
                                var uh = r.height * teOptions.dh;

                                teOptions.doc.setDrawColor.apply(undefined, lcolor);
                                teOptions.doc.setFillColor.apply(undefined, bcolor);
                                teOptions.doc.setLineWidth(lwidth);
                                teOptions.doc.rect(cell.x + ux, cell.y + uy, uw, uh, lwidth ? "FD" : "F");
                            }

                            if (typeof kids != 'undefined' && kids.length > 0)
                                drawCellElements(cell, kids, teOptions);
                        });
                    }

                    function escapeRegExp(string) {
                        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
                    }

                    function replaceAll(string, find, replace) {
                        return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
                    }

                    // Takes a string and encapsulates it (by default in double-quotes) if it
                    // contains the csv field separator, spaces, or linebreaks.
                    function csvString(cell, rowIndex, colIndex) {
                        var result = '';

                        if (cell != null) {
                            var dataString = parseString(cell, rowIndex, colIndex);

                            var csvValue = (dataString === null || dataString == '') ? '' : dataString.toString();

                            if (dataString instanceof Date)
                                result = defaults.csvEnclosure + dataString.toLocaleString() + defaults.csvEnclosure;
                            else {
                                result = replaceAll(csvValue, defaults.csvEnclosure, defaults.csvEnclosure + defaults.csvEnclosure);

                                if (result.indexOf(defaults.csvSeparator) >= 0 || /[\r\n ]/g.test(result))
                                    result = defaults.csvEnclosure + result + defaults.csvEnclosure;
                            }
                        }

                        return result;
                    }

                    function parseNumber(value) {
                        value = value || "0";
                        value = replaceAll(value, defaults.numbers.html.decimalMark, '.');
                        value = replaceAll(value, defaults.numbers.html.thousandsSeparator, '');

                        return typeof value === "number" || jQuery.isNumeric(value) !== false ? value : false;
                    }


                    function parseString(cell, rowIndex, colIndex) {
                        var result = '';

                        if (cell != null) {
                            var $cell = $(cell);
                            var htmlData;

                            if ($cell[0].hasAttribute("data-tableexport-value"))
                                htmlData = $cell.data("tableexport-value");
                            else
                                htmlData = $cell.html();

                            if (typeof defaults.onCellHtmlData === 'function')
                                htmlData = defaults.onCellHtmlData($cell, rowIndex, colIndex, htmlData);

                            if (defaults.htmlContent === true) {
                                result = $.trim(htmlData);
                            }
                            else {
                                var text = htmlData.replace(/\n/g, '\u2028').replace(/<br\s*[\/]?>/gi, '\u2060');
                                var obj = $('<div/>').html(text).contents();
                                text = '';
                                $.each(obj.text().split("\u2028"), function (i, v) {
                                    if (i > 0)
                                        text += " ";
                                    text += $.trim(v);
                                });

                                $.each(text.split("\u2060"), function (i, v) {
                                    if (i > 0)
                                        result += "\n";
                                    result += $.trim(v).replace(/\u00AD/g, ""); // remove soft hyphens
                                });

                                if (defaults.numbers.html.decimalMark != defaults.numbers.output.decimalMark ||
                                    defaults.numbers.html.thousandsSeparator != defaults.numbers.output.thousandsSeparator) {
                                    var number = parseNumber(result);

                                    if (number !== false) {
                                        var frac = ("" + number).split('.');
                                        if (frac.length == 1)
                                            frac[1] = "";
                                        var mod = frac[0].length > 3 ? frac[0].length % 3 : 0;

                                        result = (number < 0 ? "-" : "") +
                                            (defaults.numbers.output.thousandsSeparator ? ((mod ? frac[0].substr(0, mod) + defaults.numbers.output.thousandsSeparator : "") + frac[0].substr(mod).replace(/(\d{3})(?=\d)/g, "$1" + defaults.numbers.output.thousandsSeparator)) : frac[0]) +
                                            (frac[1].length ? defaults.numbers.output.decimalMark + frac[1] : "");
                                    }
                                }
                            }

                            if (defaults.escape === true) {
                                result = escape(result);
                            }

                            if (typeof defaults.onCellData === 'function') {
                                result = defaults.onCellData($cell, rowIndex, colIndex, result);
                            }
                        }

                        return result;
                    }

                    function hyphenate(a, b, c) {
                        return b + "-" + c.toLowerCase();
                    }

                    function rgb2array(rgb_string, default_result) {
                        var re = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
                        var bits = re.exec(rgb_string);
                        var result = default_result;
                        if (bits)
                            result = [parseInt(bits[1]), parseInt(bits[2]), parseInt(bits[3])];
                        return result;
                    }

                    function getCellStyles(cell) {
                        var a = getStyle(cell, 'text-align');
                        var fw = getStyle(cell, 'font-weight');
                        var fs = getStyle(cell, 'font-style');
                        var f = '';
                        if (a == 'start')
                            a = getStyle(cell, 'direction') == 'rtl' ? 'right' : 'left';
                        if (fw >= 700)
                            f = 'bold';
                        if (fs == 'italic')
                            f += fs;
                        if (f == '')
                            f = 'normal';

                        var result = {
                            style: {
                                align: a,
                                bcolor: rgb2array(getStyle(cell, 'background-color'), [255, 255, 255]),
                                color: rgb2array(getStyle(cell, 'color'), [0, 0, 0]),
                                fstyle: f
                            },
                            colspan: (parseInt($(cell).attr('colspan')) || 0),
                            rowspan: (parseInt($(cell).attr('rowspan')) || 0)
                        };

                        if (cell !== null) {
                            var r = cell.getBoundingClientRect();
                            result.rect = {
                                width: r.width,
                                height: r.height
                            };
                        }

                        return result;
                    }

                    // get computed style property
                    function getStyle(target, prop) {
                        try {
                            if (window.getComputedStyle) { // gecko and webkit
                                prop = prop.replace(/([a-z])([A-Z])/, hyphenate);  // requires hyphenated, not camel
                                return window.getComputedStyle(target, null).getPropertyValue(prop);
                            }
                            if (target.currentStyle) { // ie
                                return target.currentStyle[prop];
                            }
                            return target.style[prop];
                        }
                        catch (e) {
                        }
                        return "";
                    }

                    function getUnitValue(parent, value, unit) {
                        var baseline = 100;  // any number serves

                        var temp = document.createElement("div");  // create temporary element
                        temp.style.overflow = "hidden";  // in case baseline is set too low
                        temp.style.visibility = "hidden";  // no need to show it

                        parent.appendChild(temp); // insert it into the parent for em, ex and %

                        temp.style.width = baseline + unit;
                        var factor = baseline / temp.offsetWidth;

                        parent.removeChild(temp);  // clean up

                        return (value * factor);
                    }

                    function getPropertyUnitValue(target, prop, unit) {
                        var value = getStyle(target, prop);  // get the computed style value

                        var numeric = value.match(/\d+/);  // get the numeric component
                        if (numeric !== null) {
                            numeric = numeric[0];  // get the string

                            return getUnitValue(target.parentElement, numeric, unit);
                        }
                        return 0;
                    }

                    function downloadFile(filename, header, data) {

                        var ua = window.navigator.userAgent;
                        if (ua.indexOf("MSIE ") > 0 || !!ua.match(/Trident.*rv\:11\./)) {
                            // Internet Explorer (<= 9) workaround by Darryl (https://github.com/dawiong/tableExport.jquery.plugin)
                            // based on sampopes answer on http://stackoverflow.com/questions/22317951
                            // ! Not working for json and pdf format !
                            var frame = document.createElement("iframe");

                            if (frame) {
                                document.body.appendChild(frame);
                                frame.setAttribute("style", "display:none");
                                frame.contentDocument.open("txt/html", "replace");
                                frame.contentDocument.write(data);
                                frame.contentDocument.close();
                                frame.focus();

                                frame.contentDocument.execCommand("SaveAs", true, filename);
                                document.body.removeChild(frame);
                            }
                        }
                        else {
                            var DownloadLink = document.createElement('a');

                            if (DownloadLink) {
                                DownloadLink.style.display = 'none';
                                DownloadLink.download = filename;

                                if (header.toLowerCase().indexOf("base64,") >= 0)
                                    DownloadLink.href = header + base64encode(data);
                                else
                                    DownloadLink.href = header + encodeURIComponent(data);

                                document.body.appendChild(DownloadLink);

                                if (document.createEvent) {
                                    if (DownloadEvt == null)
                                        DownloadEvt = document.createEvent('MouseEvents');

                                    DownloadEvt.initEvent('click', true, false);
                                    DownloadLink.dispatchEvent(DownloadEvt);
                                }
                                else if (document.createEventObject)
                                    DownloadLink.fireEvent('onclick');
                                else if (typeof DownloadLink.onclick == 'function')
                                    DownloadLink.onclick();

                                document.body.removeChild(DownloadLink);
                            }
                        }
                    }

                    function utf8Encode(string) {
                        string = string.replace(/\x0d\x0a/g, "\x0a");
                        var utftext = "";
                        for (var n = 0; n < string.length; n++) {
                            var c = string.charCodeAt(n);
                            if (c < 128) {
                                utftext += String.fromCharCode(c);
                            }
                            else if ((c > 127) && (c < 2048)) {
                                utftext += String.fromCharCode((c >> 6) | 192);
                                utftext += String.fromCharCode((c & 63) | 128);
                            }
                            else {
                                utftext += String.fromCharCode((c >> 12) | 224);
                                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                                utftext += String.fromCharCode((c & 63) | 128);
                            }
                        }
                        return utftext;
                    }

                    function base64encode(input) {
                        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
                        var output = "";
                        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                        var i = 0;
                        input = utf8Encode(input);
                        while (i < input.length) {
                            chr1 = input.charCodeAt(i++);
                            chr2 = input.charCodeAt(i++);
                            chr3 = input.charCodeAt(i++);
                            enc1 = chr1 >> 2;
                            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                            enc4 = chr3 & 63;
                            if (isNaN(chr2)) {
                                enc3 = enc4 = 64;
                            } else if (isNaN(chr3)) {
                                enc4 = 64;
                            }
                            output = output +
                                keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                                keyStr.charAt(enc3) + keyStr.charAt(enc4);
                        }
                        return output;
                    }

                    return this;
                }
             });
        }

    }


}

export default Table;


let localStyle = {
    sortDirection: { width: 10, height: 20, position: 'absolute', top: '50%', right: '5px', marginTop: -14}
}
