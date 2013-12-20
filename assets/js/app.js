(function($, Handlebars, moment, window){

    var LOG_LIMIT  = 25;

    var FIREBASE_URL = 'https://spark-logger.firebaseio.com/logs/';

    var Logger = function(){

        this.$log = $(".js-logger");
        this.$clear = $(".js-clear");

        this.logs = new Firebase(FIREBASE_URL);
        this.query = this.logs.limit(LOG_LIMIT);
        this.template = Handlebars.compile($(".hbs-entry").html());

        this.query.on('child_added', $.proxy(this.writeToScreen, this));
        this.query.on('child_removed', $.proxy(this.removeFromScreen, this));
        this.$clear.on('click', $.proxy(this.clearAllLogs, this));

    }

    Logger.prototype.pushEntry = function(who, what) {
        var log = this.logs.push({who: who, when: this.now(), what: what});
        log.setPriority(this.now());
    }

    Logger.prototype.writeToScreen = function(snapshot) {
        var data = snapshot.val();
        data.date = moment.unix(data.when)
                          .format("MM/DD/YY h:mm:ssA");

        var html = this.template(data);
        var $elm = $(html).attr('id', this.uid(data));
        this.$log.append($elm);
    }

    Logger.prototype.removeFromScreen = function(snapshot) {
        var data = snapshot.val();
        $("#" + this.uid(data)).remove();
    }

    Logger.prototype.clearAllLogs = function() {
        this.logs.remove();
    }

    Logger.prototype.uid = function(data) {
        return 'i-' + data.who + '-' + data.when;
    }

    Logger.prototype.now = function() {
        return moment().unix();
    }


    $(function(){
        window.Logger = new Logger();
    });

})(jQuery, Handlebars, moment, window);