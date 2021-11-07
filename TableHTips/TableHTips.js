/* Table H-Tips for Xinha - выводит для ячеек таблицы всплывающие подсказки с информацией из соотв. ячейки шапки и ячейки первогого столбца таблицы.
v 0.3
Данный скрипт разработан inFlowia Lab. Ссылки на оригинальный код и текст соглашения ищите на inflowia.ru.

ИСПОЛЬЗОВАНИЕ:
	- добавить таблице класс h_tips
	- верно указать в этом скрипте:
		SHARED_JS_PATH
		SHARED_CSS_PATH
		Подробности см. в разделе ИЗМЕНЕНИЯ для v 0.3

ТРЕБУЕТ:
	Xinha (тестировалось на 1.5.4)
	jQuery (тестировалось на 3.3.1)
	модули от inFlowia Lab.:
		table-h-tips-shared.js v 0.3
		table-h-tips-shared.css v 0.3
	функции от inFlowia Lab.:
		см. требования в table-h-tips-shared.js

ТЕРМИНЫ:
	Подсказки - всплывающие подсказки с содержимым из заголовка таблицы, для вывода которых и существует этот плагин.
	Xinha-версия - этот плагин. Такое уточнение требуется, так как существует "обычная версия" этого плагина, которая применяется не для таблиц в Xinha, а для обычных таблиц на обычных страницах сайта.
	Обычная версия - модуль выполняющий те-же функции что и этот плагин, но предназначенный не для Xinha а для обычных страниц сайта.

ИЗМЕНЕНИЯ:
	0.3
		Общее для Xinha и обычной версии:
			- переименован CSS-класс, при помощи которого происходит подкллючение hTips -> h_tips
			- подсказки теперь появляются не по наведению а по клику (теперь их можно вызвать и на моб. устр.
			- Всплывающие подсказки теперь прилипают к краям текущей ячейки, не закрывая её контент.
			- добавлено скрытие подсказок по таймауту (таймаут задаётся в shared JS в конст. _DELAY)
			- Добавлена тень, для визуального отделения от таблицы
			- все переменные и классы переименована в более_удобочитаемый_формат
			- Для удобства доработки, часть кода и стилей вынесены в отдельные файлы:
					table-h-tips-shared.js
					table-h-tips.css
				Это разделяемые с обычной версией файлы. Если вы используете и обычную версию и Xinha-версию, то можете оставить эти файлы в единственном экземпляре, но если они будут лежать не в каталоге этого плагина, то потребуется указать для них путь в свойствах:
					SHARED_JS_PATH
					SHARED_CSS_PATH

		Специфичное для Xinha-версии:
			- По умолчанию отображение подсказок включено.
			- Кнопка плагина на панели теперь отключает и включает отображение подсказок.
			- сменена позиция с Fixed на absolute

НЕДОРАБОТКИ:
	- При наведении на подсказку она исчезает в отличие от обычной версии. Профиксить будет трудно, так как для предотвращения сохранения подсказки в контенте, она крепится к body страницы а не к body iframe Xinha
	- Введу предыдущей недоработки пока нецелесообразно делать фиксы уползаний подсказок за границу страницы (не iframe а именно страницы), так как если подсказка смещается настолько сильно что заползает под курсор то она автоматически удаляется обработчиком увода мышки с ячейки (так как подсказка в этом случае уже не является потомком текущей ячейки)
ПОТЕНЦИАЛЬНЫЕ ПРОБЛЕМЫ:
	могут быть связаны с привязкой this
*/

function TableHTips(editor){
	// автоопределение текущего каталога через мою функцию не удаётся сделать, так как в document.currentScript при вызове отсюда не оказывывается нужного значения
	// Если Xinha-версия используется в сочетании с обычнеой версией и SHARED-части в каталоге обычной версии:
	// this.SHARED_JS_PATH 	= '/lib/table-h-tips/table-h-tips-shared.js'; // если используете
	// this.SHARED_CSS_PATH	= '/lib/table-h-tips/table-h-tips-shared.css'; // подключение нежелательно вносить в SHARED_JS иначе, придётся использовать константу с путём и в обычной версии
	// Если храните SHARED-части в каталоге плагина:
	this.SHARED_JS_PATH 	= Xinha.getPluginDir('TableHTips') + '/table-h-tips-shared.js');
	this.SHARED_CSS_PATH	= Xinha.getPluginDir('TableHTips') + 'table-h-tips-shared.css');
	
	this.editor = editor;
	var cfg = editor.config;
	var self = this;
	cfg.registerButton({
    id       : "hTips",
    tooltip  : HTMLArea._lc('Откл. / Вкл. всплывающие заголовки ячеек таблиц'),
    image    : _editor_url + cfg.imgURL + 'ed_splitcel.gif',
    textMode : false,
    action   : function(editor){
			self.buttonPress(editor);
    }
  })

	cfg.addToolbarElement("hTips", "inserthorizontalrule", 1);


	TableHTips._pluginInfo = {
		name          : "TableHTips",
		version       : "0.3",
		developer     : "inFlowia Lab.",
		developer_url : "http://inflowia.ru/",
		sponsor       : "none",
		sponsor_url   : "none",
		c_owner       : "inFlowia Lab.",
		license       : "лицензия inFlowia Lab."
	};


	/* Всё, что происходит после генерации плагина
	*/
	TableHTips.prototype.onGenerateOnce = function(){
		// Подключение разделяемых частей этого плагина
		this.editor.addEditorStylesheet(this.SHARED_CSS_PATH);
		if(typeof Table_h_tips_shared !== 'function') // если shared-часть скрипта уже подключена, например стандартной версией, то подключать повтоно не нужно (это вызовет ошибку повторного объявления Table_h_tips_shared)
			Xinha._loadback(this.SHARED_JS_PATH);

		enable(); // первое включение сразу после генерации плагина
	}


	/* Включение вывода подсказок.
	Вынесено в отдельную функцию, чтобы можно было повторно включать после отключения.
	Поля задаются как статические (через имя конструктора) не как обычные поля, через this. Так сделано из-за проблем, которые начинаются в таком случае в display(), где this - это элемент, так как display - это обработчик
	*/
	function enable(){
		TableHTips.x_iframe = $('iframe#XinhaIFrame_1');
		TableHTips.x_iframe_contents = TableHTips.x_iframe.contents();

		TableHTips.x_iframe_contents.find('table.h_tips td').on('click', display); // обработчик должен быть именованным, чтобы при отключении удалить только его а не все обработчики клика по ячейке

		TableHTips.enabled = true;
	} // enable


	/* Обработчик событий, вызывающих появление подсказки.
	Вынесен в функцию для возможности отвязки от событий при отключении подсказок.
	this нельзя делать равным экземпляру TableHTips иначе отвалится получение cur_cell
	*/
	function display(e){
		let cur_cell = $(this);
		let parent_el_for_tips = $('body'); // если крепить к ячейке или к body iframe, то подсказка будет сохранена вместе с контентом
		let table_h_tips_shared = new Table_h_tips_shared(parent_el_for_tips, TableHTips.x_iframe_contents, cur_cell); // shared.  Арг.: parent_el_for_tips, parent_el_for_table, cur_cell
		table_h_tips_shared.prepare(); // shared

		if(table_h_tips_shared.is_displayed()) // если подсказки уже выведены
			return;

		parent_el_for_tips.prepend(table_h_tips_shared.top_tip);
		parent_el_for_tips.prepend(table_h_tips_shared.left_tip);

		// Данные смещения нужны, так как подсказки добавляются в body страницы, а не в iframe body
		let offset_top = TableHTips.x_iframe.offset().top - TableHTips.x_iframe_contents.scrollTop(); // не забывай, что x_iframe_contents используется именно для определения величины прокрутки, это может повести по ложному пути при вычислении других параметров
		let offset_left = TableHTips.x_iframe.offset().left - TableHTips.x_iframe_contents.scrollLeft();

		// Фиксы уползания подсказок за границы iframe
		// Фикс уползания подсказок вверх при частичном скрытии текущей ячейки за верхней границей. Нужно делать ещё и в пространстве страницы.
		let top_fix = 0; // величина, на которую нужно сместить вниз подсказки, если текущая ячейка частично скрыта за верхней границей
		if(TableHTips.x_iframe_contents.scrollTop() > cur_cell.offset().top)
			top_fix = TableHTips.x_iframe_contents.scrollTop() - cur_cell.offset().top;
		offset_top += top_fix; // применяется к обеим подсказкам

		// Фикс уползания подсказок вверх при частичном скрытии текущей ячейки за нижней границей. Не работает. Видимо нужно делать только в пространстве страницы а не iframe
		let bottom_fix = 0; // величина, на которую нужно сместить верх подсказки, если текущая ячейка частично скрыта за нижней границей
		let cur_cell_bottom_in_iframe = cur_cell.offset().top + cur_cell.outerHeight();
		let from_beg_to_last_visible_of_iframe = TableHTips.x_iframe_contents.scrollTop() + TableHTips.x_iframe.innerHeight(); // высоту нужно брать у iframe а не у iframe contents!
		if(cur_cell_bottom_in_iframe > from_beg_to_last_visible_of_iframe)
			bottom_fix = cur_cell_bottom_in_iframe - from_beg_to_last_visible_of_iframe;
		offset_top -= bottom_fix; // применяется к обеим подсказкам
		// END Фиксы уползания подсказок за границы iframe

		table_h_tips_shared.top_tip.offset({
			top:	offset_top 	+ cur_cell.offset().top - table_h_tips_shared.top_tip.outerHeight(),
			left:	offset_left + cur_cell.offset().left
		});
		table_h_tips_shared.left_tip.offset({
			top:	offset_top 	+ cur_cell.offset().top,
			left:	offset_left + cur_cell.offset().left - table_h_tips_shared.left_tip.outerWidth() // без outer не учтётся padding и граница и будет наползание влево
		});
		table_h_tips_shared.top_tip.css('z-index', 1000); // не меньше! У FullScreen Xinha z-order 999
		table_h_tips_shared.left_tip.css('z-index', 1000);

		table_h_tips_shared.finish_setting(); // shared
	}


	// Включение / выключение по нажатию кнопки на панели инструментов
	TableHTips.prototype.buttonPress = function(editor){
		if(TableHTips.enabled){
			TableHTips.x_iframe_contents.find('table.h_tips td').off('click', display);
			TableHTips.enabled = false;
		}
		else
			enable();
	} // TableHTips.prototype.buttonPress


} // TableHTips(editor)
