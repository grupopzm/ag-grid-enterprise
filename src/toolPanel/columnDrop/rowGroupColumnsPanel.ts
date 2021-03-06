import {
    Utils as _,
    SvgFactory,
    Bean,
    Component,
    Autowired,
    ColumnController,
    EventService,
    Context,
    LoggerFactory,
    DragAndDropService,
    GridOptionsWrapper,
    GridPanel,
    Logger,
    DropTarget,
    PostConstruct,
    Events,
    DraggingEvent,
    Column,
    DragSource
} from "ag-grid/main";
import {AbstractColumnDropPanel} from "./abstractColumnDropPanel";

var svgFactory = SvgFactory.getInstance();

@Bean('rowGroupColumnsPanel')
export class RowGroupColumnsPanel extends AbstractColumnDropPanel {

    @Autowired('columnController') private columnController: ColumnController;
    @Autowired('eventService') private eventService: EventService;

    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('context') private context: Context;
    @Autowired('loggerFactory') private loggerFactory: LoggerFactory;
    @Autowired('dragAndDropService') private dragAndDropService: DragAndDropService;

    constructor(horizontal: boolean) {
        super(horizontal);
    }

    @PostConstruct
    private passBeansUp(): void {
        super.setBeans({
            eventService: this.eventService,
            context: this.context,
            loggerFactory: this.loggerFactory,
            dragAndDropService: this.dragAndDropService
        });

        var localeTextFunc = this.gridOptionsWrapper.getLocaleTextFunc();
        var emptyMessage = localeTextFunc('rowGroupColumnsEmptyMessage', 'Drag here to group');
        var title = localeTextFunc('groups', 'Groups');

        super.init({
            dragAndDropIcon: DragAndDropService.ICON_GROUP,
            iconFactory: svgFactory.createGroupIcon,
            emptyMessage: emptyMessage,
            title: title
        });

        this.addDestroyableEventListener(this.eventService, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, this.refreshGui.bind(this));
    }

    protected isColumnDroppable(column:Column):boolean {
        var columnGroupable = !column.getColDef().suppressRowGroup;
        var columnNotAlreadyGrouped = !this.columnController.isColumnRowGrouped(column);
        return columnGroupable && columnNotAlreadyGrouped;
    }

    protected removeColumns(columns: Column[]) {
        // this panel only allows dragging columns (not column groups) so we are guaranteed
        // the dragItem is a column
        var rowGroupColumns = this.columnController.getRowGroupColumns();
        columns.forEach( column => {
            var columnIsGrouped = rowGroupColumns.indexOf(column) >= 0;
            if (columnIsGrouped) {
                this.columnController.removeRowGroupColumn(column);
                this.columnController.setColumnVisible(column, true);
            }
        });
    }

    protected addColumns(columns: Column[]) {
        this.columnController.addRowGroupColumns(columns);
    }

    protected getExistingColumns(): Column[] {
        return this.columnController.getRowGroupColumns();
    }

}