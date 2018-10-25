const fs = require('fs');
const path = require('path');
const _ = require('lodash');

let result = '';
let header = 
`// rules should be grouped by their types (DOMAIN/IP/USER-AGENT)
// and targets (PROXY/DIRECT/REJECT) for better performance.

[Rule]
`;

const filePath = process.argv[2];


// 分析 conf 文件，进行分类 & 去重重新生成
fs.readFile(path.resolve(__dirname, filePath), {encoding: 'utf-8'}, (e, data)=>{
    const _mainfest = [];
    let _temp = {};
    let _category = {};
    let _isComment = false, _preparedTag = '';
    data.split(/\r?\n/g).forEach(d=>{
        if(d.trim().indexOf('[') === 0){

        } else if(d.trim().indexOf('//') === 0 || d.trim().indexOf('#') === 0){
            _preparedTag = d.replace(/(\/\/)|\#/g, '').trim();
            if(_preparedTag){
                _isComment = true;
            }
        } else {
            let _d = d.replace(/\/\/(.*)$/, '').trim();

            if(!_d){
                _isComment = false;
                _preparedTag = '';
            } else {
                const info = _d.split(',');

                // console.log(info);
                const [type, keyword, target, ...extInfo] = info;
                // console.log({type, keyword, target, extInfo});

                if(type.toUpperCase() === 'FINAL'){

                } else {
                    const key = `${type.toLowerCase()}-${keyword.toLowerCase()}`;
                    if(!_temp[key]){
                        _temp[key] = target.toUpperCase();

                        let ctg = (_isComment && _preparedTag)?_preparedTag:null;
                        if(ctg){
                            _category[ctg] = 1;
                        }
                        _mainfest.push({
                            type,
                            keyword,
                            target: target.toUpperCase(),
                            extInfo,
                            category:ctg
                        });
                    } else {
                        if(_temp[key] !== target){
                            console.log('ERROR', key, 'target not fit!', _temp[key], target);
                        } else {

                        }
                    }
                }
                // if(_isComment && _preparedTag){
                //     if(!_mainfest[_preparedTag]){ _mainfest[_preparedTag] = [] };
                //     if(_mainfest[_preparedTag].indexOf(_d) == -1){
                //         _mainfest[_preparedTag].push(_d);
                //         _mainfest[_preparedTag] = _mainfest[_preparedTag].sort();
                //     }
                // } else if(_d){
                //     if(!_mainfest.normal){ _mainfest.normal = [] };
                //     if(_mainfest.normal.indexOf(_d) == -1){
                //         _mainfest.normal.push(_d);
                //         _mainfest.normal = _mainfest.normal.sort();
                //     }
                // }
            } 
        }
    });

    let proxy = '', direct = '';

    const doC = (key)=>{
        let ctg = _.filter(_mainfest, {category: key});
        ctg = _.orderBy(ctg, ['target', 'keyword'], ['asc', 'asc']);
        // result += `\n// ${key}\n`;
        let _proxyTag = false, _directTag = false;
        ctg.forEach(info=>{
            switch(info.target){
                case 'PROXY':
                    if(!_proxyTag){ 
                        proxy += `\n// ${key||'NORMAL'}\n`;
                        _proxyTag = true;
                    }
                    proxy += `${info.type},${info.keyword},${info.target}${!_.isEmpty(info.extInfo)?(','+info.extInfo):''}\n`;
                    break;
                case 'DIRECT':
                    if(!_directTag){ 
                        direct += `\n// ${key||'NORMAL'}\n`;
                        _directTag = true;
                    }
                    direct += `${info.type},${info.keyword},${info.target}${!_.isEmpty(info.extInfo)?(','+info.extInfo):''}\n`;
                    break;
            }
        });
    };

    // 处理文件
    _.forEach(_category,(i,key)=>{
        doC(key);
    });
    doC(null);

    result = header+'\n'+proxy+'\n\n'+direct+'\n\n'+'\nFINAL,PROXY';


    fs.writeFile(path.resolve(__dirname, filePath, '..', 'kitsunebi.conf'), result, (e)=>{
        if(e){throw e}
        console.log('FIN!');
    });
});