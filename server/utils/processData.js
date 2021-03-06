var log = require('../logging/bunyan'),
    config = require('./config'),
    extend = require('extend');

//creates array for elasticsearch fields such as tags, categories, etc.
var processDataArray = function(array) {
  
  if(array && array.length > 0){
    var filterNames = array.map(function(arrayItem){
      return arrayItem.name;
    });
    return filterNames;
  } else {
    return [];
  }

};

var processCatsTagsArray = function(array) {
  
  if(array && array.length > 0){
    var filterNames = array.map(function(arrayItem){
      return arrayItem.slug;
    });
    return filterNames;
  } else {
    return [];
  }

};

var audioImageProcessing = function(audio) {
  
  if(Array.isArray(audio)) {
    return audio[0];
  } else {
    return null;
  }

};

var guestAuthorProcessing = function(guestObject) {
  var guestFieldObject = [];
  
  if(!guestObject.guest_fields) {
    return null;
  }
  
  for(var i= 0; i < parseInt(guestObject.guest_fields); i++){
    guestFieldObject.push({});
  }
  for(var key in guestObject) {

    if(key.slice(0,13) === 'guest_fields_') {
      if(key.indexOf('bio') !== -1) {
        var indexBio = key.slice(13,14);
        guestFieldObject[indexBio].bio = guestObject[key][0];
      } else if(key.substr(key.length -5) === 'guest') {
        var indexName = key.slice(13,14);
        guestFieldObject[indexName].name = guestObject[key][0];
      }
    }
  }
  return guestFieldObject;
};

module.exports = {

  //process data differently depending on wordpress source
  processPost: function(wpItem, req) {
    
    var baseObject = {
      "title": wpItem.title.rendered, "siteId": wpItem.site_id, "indexdate": new Date(),
      "excerpt": wpItem.excerpt.rendered, "content": wpItem.content.rendered,
      "link": wpItem.link, "date": wpItem.date_gmt,  "id": wpItem.id,
      "author": wpItem.author_full, "image": wpItem.featured_image_obj,
      "tags": processDataArray(wpItem.tags), "categories": processDataArray(wpItem.catagories_full),
      "audio": wpItem.audio_info.audioSrc, "audioImage": audioImageProcessing(wpItem.audio_info.audioMeta)
    };
   if(req.elections) {

    return {
      "title": wpItem.title, "siteId": wpItem.site_id, "indexdate": new Date(), "episode_airdate": wpItem.episode_airdate,
      "excerpt": wpItem.excerpt, "content": wpItem.content,
      "link": wpItem.link, "date": wpItem.date_gmt,  "id": wpItem.id,
      "author": wpItem.author_info.name, "authorLink": wpItem.author_info.link,
      "imageFullSize": wpItem.all_img_info && wpItem.all_img_info.full_size ? wpItem.all_img_info.full_size : null,
      "imageUploadLocation": wpItem.all_img_info && wpItem.all_img_info.upload_location ? wpItem.all_img_info.upload_location : null,
      "imageMediumSize": wpItem.all_img_info && wpItem.all_img_info.sizes && wpItem.all_img_info.sizes.medium ? wpItem.all_img_info.sizes.medium : null,
      "imageTitle": wpItem.all_img_info && wpItem.all_img_info.title ? wpItem.all_img_info.title : '',
      "imageCaption": wpItem.all_img_info && wpItem.all_img_info.caption ? wpItem.all_img_info.caption : '',
      "tags": processCatsTagsArray(wpItem.cats_tags), "slug": wpItem.slug,
      "audio": wpItem.audio_info.audioSrc, "audioImage": audioImageProcessing(wpItem.audio_info.audioMeta)
    };
   
   }
   // if(wpItem.site_id == config.siteIds.news || wpItem.site_id == config.siteIds.perspectives || wpItem.site_id == config.siteIds.arts){
  if(wpItem.site_id == config.siteIds.perspectives) {
    
    return baseObject;
 
  
    } else if(wpItem.site_id == config.siteIds.forum) {

      var airdate = audioImageProcessing(wpItem.episode_airdate);
      return extend(baseObject, {"guests": guestAuthorProcessing(wpItem.guest_authors),
                                 "airdate": airdate !== "" ? new Date(parseInt(airdate) * 1000) : wpItem.date_gmt});
    }
  
  },

  processEndpoint: function(wpItem) {
    if(wpItem.site_id == config.siteIds.perspectives) {
      return config.siteEndpoints.perspectives;
    } else if (wpItem.site_id == config.siteIds.forum) {
      return config.siteEndpoints.forum;
    }
  }

};
