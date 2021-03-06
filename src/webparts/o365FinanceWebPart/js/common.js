import $ from "jquery";

var common = {
  generateUUID: function () {
    var d = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == "x" ? r : (r & 0x7) | 0x8).toString(16);
      }
    );
    return uuid;
  }, //生产GUID
  getRequestDigest: function (baseUrl) {
    //var digest = ""
    // if (document.getElementById("__REQUESTDIGEST") != null) {
    //   digest = document.getElementById("__REQUESTDIGEST").value
    // } else {
    //   alert("Current Request Digest Is Empty, Please Try Again!")
    // }
    return $.ajax({
      url: baseUrl + "/_api/contextinfo",
      method: "POST",
      headers: {
        "Accept": "application/json; odata=verbose"
      },
    })
    //return digest
  }, //获取post请需要的RequestDigest
  message: function (type, message) {
    var mes = {
      showClose: true,
      message: message,
      type: type
    }
    return mes
  }, //提示信息调用方法
  queryOpt: function (parm) {
    var baseUrl = parm.baseUrl + "/_api/web";
    var queryUrl = ""
    var query = ""
    var opt = {}
    if (parm.type == "get") {
      switch (parm.action) {
        case 'ListItems':
          queryUrl = baseUrl + "/lists/getbytitle('" + parm.list + "')/items" + parm.condition;
          break
        case 'ListItem':
          queryUrl = baseUrl + "/lists/getbytitle('" + parm.list + "')/items(" + parm.itemID + ")";
          break
        case 'ListEntity':
          queryUrl = baseUrl + "/lists/getbytitle('" + parm.list + "')/ListItemEntityTypeFullName";
          break
        case 'CurrentUser':
          queryUrl = baseUrl + "/currentuser"
          break
        case 'UserByName':
          // var accountName="i:0#.f|membership|test@test.test.test.cn"
          // var accountName = "i: 0#.w|domain\user" //sharepoint 2013 
          queryUrl = baseUrl + "/siteusers(@v)?@v='" + encodeURIComponent(parm.accountName) + "'"
          break
        case 'UserGroup':
          queryUrl = baseUrl + "/GetUserById(" + parm.userID + ")/groups"
          break
        case 'ListFields':
          queryUrl = baseUrl + "/lists/getbytitle('" + parm.list + "')/fields";
          break
        case 'Attachments':
          queryUrl = parm.attUrl
          break
      }
      if (parm.action == "UserByName") {
        query = queryUrl
      } else {
        query = encodeURI(queryUrl)
      }
      opt = {
        url: query,
        type: 'Get',
        headers: {
          'accept': 'application/json;odata=verbose'
        },
        contentType: "application/json",
      }
      if (parm.async != undefined) {
        opt.async = parm.async
      }
    } else if (parm.type == "post") {
      var headers = {}
      switch (parm.action) {
        case 'AddInList':
          queryUrl = baseUrl + "/lists/getbytitle('" + parm.list + "')/items";
          headers = {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": parm.digest
          }
          break
        case 'EditListItem':
          queryUrl = baseUrl + "/lists/getbytitle('" + parm.list + "')/items(" + parm.itemID + ")";
          headers = {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": parm.digest,
            "IF-MATCH": "*",
            "X-HTTP-Method": "MERGE"
          }
          break
        case 'Attachements':
          queryUrl = parm.attUrl + "/add(FileName='" + parm.fileName + "')";
          headers = {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": parm.digest
          }
          break
        case 'AddFile':
          queryUrl = baseUrl + "/lists/getbytitle('" + parm.list + "')/rootfolder/files/add(overwrite=true,url='" + parm.fileName + "')";
          headers = {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": parm.digest
          }
      }
      if (parm.action == 'Attachements' || parm.action == 'AddFile') {
        opt = {
          url: encodeURI(queryUrl),
          method: "post",
          headers: headers,
          data: parm.fileArr,
          processData: false
        }
      } else {
        opt = {
          url: encodeURI(queryUrl),
          method: "post",
          headers: headers,
          data: JSON.stringify(parm.item)
        }
      }
      /* var item = {
         '__metadata': {
           type: "SP.Data.ECCSubInfoListItem" --ListType
          },
       'Title': d.Title --ListData
      }
      }*/
    } else if (parm.type == "delete") {
      switch (parm.action) {
        case 'DeleteListItem':
          queryUrl = baseUrl + "/lists/getbytitle('" + parm.list + "')/items(" + parm.itemID + ")";
          break
        case 'DeleteAttachment':
          queryUrl = baseUrl + "/lists/getbytitle('" + parm.list + "')/items(" + parm.itemID + ")/AttachmentFiles/getByFileName('" + parm.fileName + "')"
          break
      }
      opt = {
        url: encodeURI(queryUrl),
        type: "DELETE",
        headers: {
          "accept": "application/json;odata=verbose",
          "X-RequestDigest": parm.digest,
          "IF-MATCH": "*"
        },
      }
    }
    return opt
  }, //Rest API请求option
  getFileBuffer: function (file) {
    var deferred = $.Deferred();
    var reader = new FileReader();
    reader.onloadend = function (e) {
      deferred.resolve(e.target.result);
    };
    reader.onerror = function (e) {
      deferred.reject(e.target.error);
    };
    reader.readAsArrayBuffer(file);
    return deferred.promise();
  }, //将文件转成文件流
  storage: function (parm) {
    if (parm.type == "get") {
      return JSON.parse(localStorage.getItem(parm.key))
    } else if (parm.type == "set") {
      localStorage.setItem(parm.key, JSON.stringify(parm.value))
    } else if (parm.type == "remove") {
      localStorage.removeItem(parm.key)
    }
  },//处理缓存
  GetParameterValues: function (param) {
    var url = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < url.length; i++) {
      var urlparam = url[i].split('=');
      if (urlparam[0] == param) {
        return urlparam[1];
      }
    }
  },//获取URL参数
  service: function (opt) {
    var deferred = $.Deferred();
    $.ajax(opt)
      .done(result => {
        deferred.resolve(result);
      })
      .catch(result => {
        deferred.reject(result);
      });
    return deferred.promise();
  },//封装好的promiss方法
  print: function (id) {
    var printAreaCount = 0
    var ele = $(id);
    var idPrefix = "printArea_";
    common.removePrintArea(idPrefix + printAreaCount);
    printAreaCount++;
    var iframeId = idPrefix + printAreaCount;
    var iframeStyle = 'position:absolute;width:0px;height:0px;left:-500px;top:-500px;';
    var iframe = document.createElement('IFRAME');
    $(iframe).attr({
      style: iframeStyle,
      id: iframeId
    });
    // iframe.onload = function(){
    //   alert("Local iframe is now loaded.");
    //   };
    document.body.appendChild(iframe);
    var doc = iframe.contentWindow.document;
    doc.open()
    $(document).find("link").filter(function () {
      return $(this).attr("rel").toLowerCase() == "stylesheet";
    }).each(
      function () {
        doc.write('<link type="text/css" rel="stylesheet" href="' +
          $(this).attr("href") + '" >');
      });
    doc.write('<div class="' + $(ele).attr("class") + '">' + $(ele).html() +
      '</div>');
    doc.close();
    if (!iframe.readyState || iframe.readyState == "complete") {
      console.log("Local iframe is now loaded.");
      var frameWindow = iframe.contentWindow;
      frameWindow.close();
      frameWindow.focus();
      frameWindow.print();
    } else {
      console.log("Local iframe is now loaded.Error");
    }
  },//打印入口方法
  removePrintArea: function (id) {
    $("iframe#" + id).remove();
  },//关闭打印的方法
  getCurrentDate: function () {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var currentTime = year + "-" + month + "-" + day;
    return currentTime;
  },//获取当前时间
  getCurrentDate_NoLine: function () {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var formatMonth = ""
    var formatDay = ""
    if (month.toString().length == 1) {
      formatMonth = "0" + month.toString()
    } else {
      formatMonth = month.toString()
    }
    if (day.toString().length == 1) {
      formatDay = "0" + day.toString()
    } else {
      formatDay = day.toString()
    }
    var currentTime = year.toString() + formatMonth + formatDay;
    return currentTime;
  },//获取当前时间并去掉了’-’
}
export default common
