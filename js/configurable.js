var Configurable = {
    setOptions: function(options) {
        this.options = {};
        var constructor = this.constructor;
        if (constructor.superclass) {
            // build the inheritance chain
            var chain = [], klass = constructor;
            while (klass = klass.superclass) chain.push(klass);
            chain = chain.reverse();
            for (var i = 0, len = chain.length; i < len; ++i)
            {
                if(klass !== null)
                    Object.extend(this.options, klass.DEFAULT_OPTIONS || {});
            }
        }
        Object.extend(this.options, constructor.DEFAULT_OPTIONS);
        return Object.extend(this.options, options || {});
    }
};
