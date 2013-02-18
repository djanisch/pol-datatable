Selectbox = Class.create(Configurable, {
    body_node_ : '',
    initialize: function(options) 
    {
        this.setOptions(options);
        this.run();
    },
    run : function()
    {
        $$('body').each(function(body){
            body.writeAttribute({'role': 'application'});
            this.body_node_ = body;
        }.bind(this));
        $$('select.' + this.options.class_name).each(function(element){
            this.createSelectList(element);
            this.createMenuLink(element);
            element.hide().writeAttribute({'aria-hidden': 'true'});
            var id = element.readAttribute('id') + '-' + this.options.link_name;
            $$('label[for="'+element.readAttribute('id')+'"]').each(function(label){
                label.writeAttribute({'for': id});
            }.bind(id));
        }.bind(this));
        this.body_node_.observe('click', this.checkList.bindAsEventListener(this));
    },
    createSelectList : function(element)
    {
        var offset = element.cumulativeOffset();
        var list = '<ul id="' + element.readAttribute('id') + '-' + this.options.link_name + '-menu" aria-labelledby="' + element.readAttribute('id') + '-' + this.options.link_name + '" aria-hidden="true" role="listbox" class="selectbox-menu" style="display: none; left: '+offset.left+ 'px; top:'+ (offset.top+element.getHeight())+ 'px;">';
        element.childElements().each(function(listitem){
            list += '<li';
            if(listitem.selected)
                list +=' aria-selected="true"';
            list += '><a href="#" role="option">'+listitem.innerHTML+'</a><span class="option-value skip">'+listitem.readAttribute('value')+'</span></li>';
        }.bind(list));
        this.body_node_.insert({'bottom' : list});
        if($(element.readAttribute('id') + '-' + this.options.link_name + '-menu').select('[aria-selected="true"]').length == 0)
            $(element.readAttribute('id') + '-' + this.options.link_name + '-menu').firstDescendant().writeAttribute({'aria-selected' : 'true'});
    },
    createMenuLink : function(element)
    {
        var s_option;
        $(element.readAttribute('id') + '-' + this.options.link_name + '-menu').select('[aria-selected="true"]').each(function(option){
            s_option = option;
        }.bind(s_option));
        var link = '<a id="' + element.readAttribute('id') + '-' + this.options.link_name + '" href="#" class="custom-select group" aria-haspopup="true" role="button" aria-owns="'+element.readAttribute('id') + '-' + this.options.link_name + '-menu"><span class="custom-select-text">'+s_option.firstDescendant().innerHTML+'</span><span class="custom-select-button-icon"></span>';
        element.insert({after: link});
    },
    checkList : function(event)
    {
        if(!this.catchButtonEvent(event) && !this.updateMenu(event))
            this.hideOpenMenus(event);
    },
    catchButtonEvent : function(event)
    {
        var menu, element;
        element = event.findElement('a.custom-select');
        if(element == null || element == document)
            return false;
        event.stop();
        menu = $(element.readAttribute('id')+'-menu');
        this.toggleMenu(menu);
        return true;
    },
    toggleMenu : function(menu)
    { 
        if(menu.getStyle('display') == 'none')
        {
            menu.show();
            menu.writeAttribute({'aria-hidden' : 'false'});
            var element = $(menu.readAttribute('aria-labelledby'));
            var offset = element.cumulativeOffset();
            menu.setStyle({left: offset.left+'px', top: (offset.top+element.getHeight())+'px'});
        }
        else
        {
            menu.hide();
            menu.writeAttribute({'aria-hidden': 'true'});
        }
    },
    updateMenu : function(event)
    {
        var element = event.findElement('ul.selectbox-menu li a');
        if(element == null || element == document)
            return false;
        event.stop();
        var menu = element.up().up();
        if(menu.readAttribute('id') == null)
            return false;
        $$('a[aria-owns="'+menu.readAttribute('id')+'"]').each(function(link){
            link.firstDescendant().innerHTML = element.innerHTML;
        }.bind(element));
        $$('#'+menu.readAttribute('id')+' li[aria-selected="true"]').each(function(link){
            link.writeAttribute({'aria-selected' : 'false'});
        });
        element.up().writeAttribute({'aria-selected' : 'true'});
        var id = element.up().up().readAttribute('id').gsub('-' + this.options.link_name + '-menu', '');
        var option_value = element.up().select('.option-value').first().innerHTML;
        $(id).select('option').each(function(option){
        	option.selected=false;
        });
        $(id).select('option[value="'+option_value+'"]').first().selected=true;
        this.toggleMenu(menu);
        return element.next().innerHTML;
    },
    hideOpenMenus : function(event)
    {
        $$('ul[aria-hidden="false"]').each(function(menu){
            this.toggleMenu(menu);
        }.bind(this));
    }
});

Selectbox.DEFAULT_OPTIONS = {
    class_name: 'selectbox',
    link_name: 'button'
};

Datatable_Selectbox = Class.create(Selectbox, {
    value_ : '',
    initialize: function(options) 
    {
        this.setOptions(options);
        if($('choose-project-form') !== null)
        {
            this.value_ = $('choose-project').value;
            $$('#choose-project-form input[type="submit"]').each(function(input){
                input.hide();
            });
        }
        this.run();
    },
    checkList : function(event)
    {
        var select_value = this.updateMenu(event);
        if(!this.catchButtonEvent(event) && select_value === false)
        {
            this.hideOpenMenus(event);
        }
        if(select_value !== false)
        {
            if($('choose-project-form') !== null && this.value_ != $('choose-project').value)
            {
                $('choose-project-form').submit();
            }
            this.options.dt_instance.updateTable();
        }
            
    }
});

Datatable_Selectbox.DEFAULT_OPTIONS = {
    class_name: 'selectbox',
    link_name: 'button',
    dt_instance: ''
};

Datatable = Class.create(Configurable, {
    arr_cell_classes_ : new Array,
    arr_search_values_class_ : new Array,
    cell_cnt_ : 0,
    arr_table_headers_ : new Array,
    initialize: function(options) 
    {
        this.setOptions(options);
        this.run();
    },
    run : function()
    {
        this.prepareTable();
        this.addHeaderComboBox();
        new Datatable_Selectbox({dt_instance: this});
    },
    prepareTable: function()
    {
        $$('#'+ this.options.table_id + ' tr').each(function(row){
            var arr_header_cells = row.getElementsByTagName('th');
            for(cnt=0; cnt < arr_header_cells.length; ++cnt)
            {
                this.arr_cell_classes_[cnt] = this.options.header_class_name + cnt;
                arr_header_cells[cnt].addClassName(this.options.header_class_name + cnt);
                this.arr_search_values_class_[cnt] = new Array();
                if(row.cells[cnt].hasAttribute('id'))
                {
                    this.arr_table_headers_.push(row.cells[cnt].id);
                }
                else
                {
                    row.cells[cnt].writeAttribute({ 'id' : this.options.table_id + '-c' + cnt});
                    this.arr_table_headers_.push(this.options.table_id + '-c' + cnt);
                }
            }
            this.cell_cnt_ = 0;
            var value = '';
            for(cnt=0; cnt < row.cells.length; ++cnt)
            {
                if(row.cells[cnt].tagName != 'TH')
                {
                    value = row.cells[cnt].innerHTML.stripTags();
                    this.arr_search_values_class_[cnt].push(value);
                    row.cells[cnt].insert('<span class="' + this.options.header_class_name + cnt + '" style="display: none;">' + value + '</span>');
                    if(!row.cells[cnt].hasAttribute('headers'))
                    {
                        row.cells[cnt].writeAttribute({'headers' : this.arr_table_headers_[cnt]});
                    }
                }
            }
        }.bind(this));
        for(cnt=0; cnt < this.arr_search_values_class_.length; ++cnt)
        {
            this.arr_search_values_class_[cnt] = this.arr_search_values_class_[cnt].sort();
            this.arr_search_values_class_[cnt] = this.arr_search_values_class_[cnt].uniq(true);
        }
    },
    addHeaderComboBox : function()
    {
        var arr_header_cells = document.getElementsByTagName('th');
        var insert_string = '';
        $(this.options.table_id).wrap('div', {'id' : this.options.header_class_name + 'table-selectbox'});
        var insert_string_list = '<div id="' + this.options.header_class_name + 'table-selecttitle"><a href="#" aria-haspopup="true" role="button" aria-owns="' + this.options.header_class_name + 'table-selectlist">' + this.options.display_name + '</a></div><ul id="' + this.options.header_class_name + 'table-selectlist" style="display: none;">';
        for(cnt=0; cnt < arr_header_cells.length; ++cnt)
        {
            if(!arr_header_cells[cnt].hasClassName(this.options.essential_class_name))
            {
                insert_string_list +=  '<li><input type="checkbox" value="'+ this.arr_table_headers_[cnt] + '" checked /> ' + arr_header_cells[cnt].innerHTML.stripTags() + '</li>';
            }
            insert_string = '<select class="selectbox" name="' + this.options.header_class_name + cnt + '" id="' + this.options.header_class_name + cnt + '">';
            insert_string += '<option value="tableheader-value">' + arr_header_cells[cnt].innerHTML.stripTags() + '</option>';
            for(subcnt=0; subcnt < this.arr_search_values_class_[cnt].length; ++subcnt)
            {
                insert_string += '<option value="' + this.arr_search_values_class_[cnt][subcnt] + '">' + this.arr_search_values_class_[cnt][subcnt] + '</option>';
            }
            insert_string += '</select>';
            arr_header_cells[cnt].update(insert_string);
        }
        insert_string_list += '</ul>';
        $(this.options.header_class_name + 'table-selectbox').insert({'top' : insert_string_list});
        $(this.options.header_class_name + 'table-selecttitle').observe('click', this.toggleMenu.bindAsEventListener(this));
        $$('#' + this.options.header_class_name + 'table-selectlist input[type="checkbox"]').each(function(element){
            element.observe('change', function(event){
                var input = Event.findElement(event);
                $(input.value).toggle();
                $$('td[headers="' + input.value + '"]').each(function(td){
                    td.toggle();
                });
            });
        });
    },
    updateTable : function()
    {
        var arr_choosen = new Array();
        $$('#'+ this.options.table_id + ' th a[role="button"]').each(function(item){
            var id = item.id.gsub('-button', '');
            if($(id).selectedIndex > 0)
            {
                var arr_value = new Object();
                arr_value['id'] = id;
                arr_value['value'] = $(id).value;
                arr_choosen.push(arr_value);
            }
        }.bind(arr_choosen));
        $$('#'+ this.options.table_id + ' tr').each(function(row){
            var arr_cells = row.getElementsByTagName('td');
            var tmp_checksum = 0;
            var value = '';
            for(cnt=0; cnt < arr_cells.length; ++cnt)
            {
                for(sub_cnt=0; sub_cnt < arr_choosen.length; ++sub_cnt)
                {
                    value = Selector.findChildElements(arr_cells[cnt], ['span.' + arr_choosen[sub_cnt].id]).first();
                    if(value !== undefined && value.innerHTML == arr_choosen[sub_cnt].value)
                    {
                        ++tmp_checksum;
                    }
                }
            }
            if(tmp_checksum>=arr_choosen.length || arr_cells.length==0)
            {
                row.show();
            }
            else
            {
                row.hide();
            }
        }.bind(arr_choosen))
    },
    toggleMenu : function(event)
    {
        event.stop();
        $(this.options.header_class_name + 'table-selectlist').toggle();
    }
});

Datatable.DEFAULT_OPTIONS = {
    table_id: 'datatable',
    header_class_name: 'datatable-class-',
    display_name: 'Spalten',
    essential_class_name : 'essential'
};

