/**
 * @file 阿里OSS上传模块
 * @author fenglinzeng(fenglinzeng@gmail.com)
 * Date: 2017/09/01
 * @intro:
 * 模块接收4个参数targerID,containerID,types,onUploaded，前三个为必填。
 *
 * targerID为字符串，是上传按钮id
 * containerID为字符串，为targerID的父级，这个随意选一个父级dom就可以
 * types为字符串，是上传文件类型，目前有4种，参看extensions对象的key
 * onUploaded是文件上传aliOSS完成的回调
 *
 * 具体用法参考entry/userSetting
 */
define('module/aliOSS', [
    'plupload',
    'uuid'
], require => {
    xLog('module/aliOSS~');
    const uuid = require('uuid');
    return function(targerID, containerID, types, onUploaded) {
        if (!targerID || !containerID || !types) {
            return alert('缺少必填参数，具体用法请查看module/aliOSS');
        }
        let accessid = '';
        let host = '';
        let policyBase64 = '';
        let signature = '';
        let callbackbody = '';
        let key = '';
        let expire = 0;
        let gObjectName = '';
        let gObjectNameType = '';
        let timestamp = Date.parse(new Date()) / 1000;
        let now = timestamp;
        let suffix = '';

        const extensions = {
            image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
            video: ['.mp4', '.avi', '.wmv', '.rm', '.rmvb', '.mkv', 'mov'],
            audio: ['.mp3', '.wma', '.wav', '.amr'],
            attachment: ['.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar']
        };

        // 取扩展名
        function getFileType(type) {
            let fileType = '';
            for (var ext in extensions) {
                if (extensions.hasOwnProperty(ext)) {
                    extensions[ext].forEach(ele => {
                        if (ele.indexOf(type) !== -1) {
                            return fileType = ext;
                        }
                    });
                }
            }
            return fileType;
        }

        // 取token
        function sendRequest() {
            let xmlhttp = null;
            if (window.XMLHttpRequest) {
                xmlhttp = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
            }

            if (xmlhttp !== null) {
                const serverUrl = vars.urlSignature;
                xmlhttp.open('POST', serverUrl, false);
                xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                xmlhttp.send(null);
                return xmlhttp.responseText;
            }
            alert('Your browser does not support XMLHTTP.');
        }

        // 文件名随机还是跟随文件
        function checkObjectRadio() {
            gObjectNameType = vars.uploadNameType;
        }

        // 获取上传签名
        function getSignature() {
            // 可以判断当前expire是否超过了当前时间,如果超过了当前时间,就重新取一下.3s 做为缓冲
            now = timestamp = Date.parse(new Date()) / 1000;
            if (expire < now + 3) {
                const body = sendRequest();
                const obj = eval('(' + body + ')');
                host = obj.host;
                policyBase64 = obj.policy;
                accessid = obj.accessid;
                signature = obj.signature;
                expire = parseInt(obj.expire);
                callbackbody = obj.callback;
                key = obj.dir;
                return true;
            }
            return false;
        }

        // 获取文件扩展名
        function getSuffix(filename) {
            const pos = filename.lastIndexOf('.');
            suffix = '';
            if (pos !== -1) {
                suffix = filename.substring(pos);
            }
            return suffix;
        }

        // 文件名是随机还是跟随文件
        function calculateObjectName(filename) {
            if (gObjectNameType === 'local') {
                gObjectName += '${filename}';
            } else if (gObjectNameType === 'random') {
                suffix = getSuffix(filename);
                gObjectName = key + uuid() + suffix;
            } else {
                suffix = getSuffix(filename);
                gObjectName = key + uuid() + suffix;
            }
            return '';
        }

        // 设置上传参数
        function setUploadParam(up, filename, ret) {
            if (ret === false) {
                ret = getSignature();
            }
            gObjectName = key;
            if (filename !== '') {
                suffix = getSuffix(filename);
                calculateObjectName(filename);
            }
            const newMultipartParams = {
                key: gObjectName,
                policy: policyBase64,
                OSSAccessKeyId: accessid,
                success_action_status: '200', // 让服务端返回200,不然，默认会返回204
                callback: callbackbody,
                signature: signature
            };

            up.setOption({
                url: host,
                multipart_params: newMultipartParams
            });

            up.start();
        }

        function getMimeTypes(types) {
            const mimeTypes = {
                image: {
                    title: 'image',
                    extensions: 'jpg,gif,png,bmp,jpeg'
                },
                attachment: {
                    title: 'attachment',
                    extensions: 'txt,pdf,doc,docx,xls,xlsx,ppt,pptx,zip,rar'
                },
                video: {
                    title: 'video',
                    extensions: 'mp4,avi,wmv,rm,rmvb,mkv,mov'
                },
                audio: {
                    title: 'audio',
                    extensions: 'mp3,wma,wav,amr'
                }
            };
            const mimeArr = [];
            const mime = mimeTypes[types];
            if (mime) {
                mimeArr.push(mime);
            } else {
                $.alert('aliOSS上传组件调用有误');
            }
            return mimeArr;
        }

        const uploader = new plupload.Uploader({
            runtimes: 'html5,flash,silverlight,html4',
            browse_button: targerID,
            multi_selection: false,
            container: document.getElementById(containerID),
            flash_swf_url: '//cdn.bootcss.com/plupload/2.1.2/Moxie.swf',
            silverlight_xap_url: 'lib/plupload-2.1.2/js/Moxie.xap',
            url: 'http://oss.aliyuncs.com',

            filters: {
                // 只允许上传图片和zip,rar文件
                mime_types: getMimeTypes(types),
                // 最大只能上传10mb的文件
                max_file_size: '10mb',
                // 不允许选取重复文件
                prevent_duplicates: true
            },

            init: {
                PostInit: function() {
                    xLog('upload init');
                },

                FilesAdded: function(up, files) {
                    plupload.each(files, file => {
                        xLog(file, file.id, file.name, plupload.formatSize(file.size));
                    });
                    setUploadParam(uploader, '', false);
                },

                BeforeUpload: function(up, file) {
                    checkObjectRadio();
                    setUploadParam(up, file.name, true);
                },

                UploadProgress: function(up, file) {
                    xLog('Progress', file.percent);
                },

                FileUploaded: function(up, file, info) {
                    xLog('uploaded:', up, file, info);
                    // var fileType = getFileType(suffix);
                    // $.alert('filetype: ' + fileType + '<br>filename：' + file.name + '<br>url：' + gObjectName + '<br>size：' + (file.size / 1000) + 'kb', '上传完成');
                    xLog(suffix);

                    // 域名收敛，取相对协议
                    // var hostURL = host.split('http:')[1];
                    const hostURL = host;
                    onUploaded && onUploaded(up, file, info, hostURL, gObjectName);
                },

                Error: function(up, err) {
                    if (err.code === -600) {
                        $.alert('\n选择的文件太大了，当前限制为10MB');
                    } else if (err.code === -601) {
                        $.alert('\n只支持以下格式<br>' + extensions[types] + '<br>你上传的文件名为:<br>' + err.file.name, '扩展名不符合要求');
                        console.log(up);
                    } else if (err.code === -602) {
                        $.alert('\n这个文件已经上传过一遍了');
                    } else {
                        $.alert('\nError xml:' + err.response);
                    }
                }
            }
        });

        uploader.init();
    };
});