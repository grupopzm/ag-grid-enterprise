import {
    Bean,
    Context,
    IRowNodeStage,
    Autowired,
    SelectionController,
    GridOptionsWrapper,
    ColumnController,
    ValueService,
    EventService,
    RowNode,
    Column,
    Utils as _
} from "ag-grid/main";

@Bean('groupStage')
export class GroupStage implements IRowNodeStage {

    @Autowired('selectionController') private selectionController: SelectionController;
    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('columnController') private columnController: ColumnController;
    @Autowired('valueService') private valueService: ValueService;
    @Autowired('eventService') private eventService: EventService;
    @Autowired('context') private context: Context;

    public execute(rowNode: RowNode): void {

        var rowsAlreadyGrouped = _.exists(this.gridOptionsWrapper.getNodeChildDetailsFunc());
        
        var groupedCols = this.columnController.getRowGroupColumns();
        var expandByDefault: number;

        if (this.gridOptionsWrapper.isGroupSuppressRow()) {
            expandByDefault = -1;
        } else {
            expandByDefault = this.gridOptionsWrapper.getGroupDefaultExpanded();
        }

        // putting this in a wrapper, so it's pass by reference
        var groupId = {value: -1};
        this.recursivelyGroup(rowNode, groupedCols, 0, expandByDefault, groupId, rowsAlreadyGrouped);
    }

    private recursivelyGroup(rowNode: RowNode, groupColumns: Column[], level: number, expandByDefault: any, groupId: any, rowsAlreadyGrouped: boolean): void {

        var groupingThisLevel = level < groupColumns.length;
        rowNode.leafGroup = level === groupColumns.length;

        if (groupingThisLevel && !rowsAlreadyGrouped) {
            var groupColumn = groupColumns[level];
            this.setChildrenAfterGroup(rowNode, groupColumn, groupId, expandByDefault, level);
            rowNode.childrenAfterGroup.forEach( child => {
                this.recursivelyGroup(child, groupColumns, level + 1, expandByDefault, groupId, rowsAlreadyGrouped);
            });
        } else {
            rowNode.childrenAfterGroup = rowNode.allLeafChildren;
            rowNode.childrenAfterGroup.forEach( child => {
                child.level = level;
                child.parent = rowNode;
            });
        }

    }

    private setChildrenAfterGroup(rowNode: RowNode, groupColumn: Column, groupId: any, expandByDefault: any, level: number): void {

        rowNode.childrenAfterGroup = [];
        rowNode.childrenMapped = {};

        rowNode.allLeafChildren.forEach( child => {

            var groupKey = this.valueService.getValue(groupColumn, child);

            var groupForChild = <RowNode> rowNode.childrenMapped[groupKey];
            if (!groupForChild) {
                groupForChild = this.createGroup(groupColumn, groupKey, rowNode, groupId, expandByDefault, level);
                rowNode.childrenMapped[groupKey] = groupForChild;
                rowNode.childrenAfterGroup.push(groupForChild);
            }

            groupForChild.allLeafChildren.push(child);
        });
    }

    private createGroup(groupColumn: Column, groupKey: string, parent: RowNode, groupId: any, expandByDefault: any, level: number): RowNode {
        var nextGroup = new RowNode();
        this.context.wireBean(nextGroup);

        nextGroup.group = true;
        nextGroup.field = groupColumn.getColDef().field;
        nextGroup.id = groupId.value--;
        nextGroup.key = groupKey;
        nextGroup.expanded = this.isExpanded(expandByDefault, level);
        nextGroup.allLeafChildren = [];
        nextGroup.allChildrenCount = 0;
        nextGroup.level = level;

        var includeParents = !this.gridOptionsWrapper.isSuppressParentsInRowNodes();
        nextGroup.parent = includeParents ? parent : null;

        return nextGroup;
    }

    private isExpanded(expandByDefault: number, level: any) {
        if (expandByDefault===-1) {
            return true;
        } else {
            return level < expandByDefault;
        }
    }

}
