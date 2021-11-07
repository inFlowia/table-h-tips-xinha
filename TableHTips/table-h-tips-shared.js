/*Функционал, разделяемый между обычной и Xinha-версией.
v 0.3

ТРЕБУЕТ:
		get_css_numeric_val()
*/


class Table_h_tips_shared{
	/* АРГ.:
		все аргументы - это jQ-объекты
		parent_el_for_tips - элемент, для прикрепления непосредственно подсказок
			обычная версия - тек. ячейчка таблицы
			Xinha-версия - body страницы (чтобы избежать сохранения подсказки)
		parent_el_for_table - элемент, в котором будет проводится поиск по селектору table.h_tips, для привязки событий (требуется дл совместимости с xinha)
			обычная версия - body
			Xinha-версия - $('iframe#XinhaIFrame_1').contents()
		cur_cell - текущая ячейка (та, для которой выводятся подсказки)
	*/
	constructor(parent_el_for_tips, parent_el_for_table, cur_cell){
		this._DELAY = 18; // задержка в с. перед автоматическим закрытием

		this._parent_el_for_tips 	= parent_el_for_tips;
		this._parent_el_for_table 	= parent_el_for_table;
		this._cur_cell = cur_cell;

		// обеспечение того, чтобы this в методах этого класса указывал на экземпляр этого класса
		this.prepare = this.prepare.bind(this);
		this.finish_setting = this.finish_setting.bind(this);
				this.is_displayed = this.is_displayed.bind(this);
		this._remove_cur = this._remove_cur.bind(this);
		this._handle_remove_cur = this._handle_remove_cur.bind(this);
	}


	/* Подготовка к выводу подсказок.
	Должна быть вызвана до добавления подсказок в DOM
	*/
	prepare(){
		if(this.is_displayed())
			return; // не нужно создавать лишних если уже есть

		let col_num = this._cur_cell.parent().children().index(this._cur_cell);
		let cur_hat_cell =  this._cur_cell.parent().parent().children().first().children().eq(col_num);
		let top_tip_content = cur_hat_cell.html();
		let cur_first_in_row_cell = this._cur_cell.parent().children().first()
		let left_tip_content = cur_first_in_row_cell.html();

		this.top_tip = $("<div class = 'table_h_tip table_h_tip_top'>" + top_tip_content +'</div>',);
		$(this.top_tip).css({
			'width': this._cur_cell.width() + 'px',
			'padding-left'	: get_css_numeric_val(cur_hat_cell.css('padding-left')),
			'padding-right'	: get_css_numeric_val(cur_hat_cell.css('padding-right'))
		});

		this.left_tip = $('<div class = "table_h_tip table_h_tip_left">' + left_tip_content + '</div>',);
		$(this.left_tip).css({
			'width': $(cur_first_in_row_cell).width() + 'px',
			'height': $(cur_first_in_row_cell).innerHeight() + 'px',
			'padding-left'	: get_css_numeric_val(cur_first_in_row_cell.css('padding-left')),
			'padding-right'	: get_css_numeric_val(cur_first_in_row_cell.css('padding-right'))
		});

		// удалить по таймауту.
		let timeout_id = setTimeout(this._remove_cur, this._DELAY * 1000);
		this._parent_el_for_tips.data('table_h_tips_timeout_id', timeout_id);
	};


	/* Завершает настройку подсказок.
	Здесь выполняются все операции, которые нельзя выполнить до добавления подсказок в DOM.
	*/
	finish_setting(){
		// нужно передавать имя обработчика, это позволит отвязывать его при необходимости
		this._parent_el_for_table.find('table.h_tips td').mouseleave(this._handle_remove_cur);
		this._parent_el_for_table.find('table.h_tips td').on('click', '.table_h_tip', this._handle_remove_cur);
	};


	/* проверяет, выведен ли уже элемент */
	is_displayed(){
		if(this._parent_el_for_tips.children('.table_h_tip').length)
			return true;
		else
			return false;
	}


	/* удаляет текущую подсказку и выполняет все необходимые очистки
	НЕДОРАБОТКИ: не удаляет из _parent_el_for_tips.data с ИД таймера, а просто очищает его
	*/
	_remove_cur(){
		if(this._parent_el_for_tips.data('table_h_tips_timeout_id'))
			clearTimeout(this._parent_el_for_tips.data('table_h_tips_timeout_id')); // нужно сбросить таймер, чтобы при повторном вызове недавно показанной подсказки она досрочно не исчезала
		this._parent_el_for_tips.data('table_h_tips_timeout_id', '');
		this._parent_el_for_tips.children('.table_h_tip').remove(); // если начнутся проблемы с удалением, то обдумать переход с children() на find()
		this._parent_el_for_table.find('table.h_tips td').off('mouseleave', this._remove_cur); // если не удалить обработчик, то события будут будут бессмысленно всплывать на каждой ячейке даже после скрытия.
	}

	/* обработчик удаления подсказки по собитию
	Потребовалось вынести в отдельный метод, так как в случае закрытия по таймауту не аргумента события, нет события и соотв. не нужен вызов stopPropagation()
	*/
	_handle_remove_cur(e){
		this._remove_cur()
		e.stopPropagation(); // отмена всплытия собития на родительском (без этого подсказки опять появятся сразу после удаления)
	}
} // обл. видимости констант
