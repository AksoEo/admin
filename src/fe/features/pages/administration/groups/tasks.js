import { h } from 'preact';
import { Dialog, TextField } from '@cpsdqs/yamdl';
import { adminGroups as locale } from '../../../../locale';
import { Validator } from '../../../../components/form';
import TaskDialog from '../../../../components/task-dialog';
import { routerContext } from '../../../../router';

export default {
    create ({ open, task }) {
        return (
            <routerContext.Consumer>
                {routerContext => (
                    <TaskDialog
                        open={open}
                        onClose={() => task.drop()}
                        title={locale.add}
                        actionLabel={locale.addButton}
                        run={() => task.runOnce().then(id => {
                            routerContext.navigate(`/administrado/grupoj/${id}`);
                        })}>
                        <Validator
                            component={TextField}
                            label={locale.fields.name}
                            value={task.parameters.name || ''}
                            onChange={e => task.update({ name: e.target.value })}
                            validate={name => {
                                if (!name) throw { error: locale.nameRequired };
                            }} />
                        <Validator
                            component={TextField}
                            label={locale.fields.description}
                            value={task.parameters.description || ''}
                            onChange={e => task.update({ description: e.target.value })}
                            validate={() => {}} />
                    </TaskDialog>
                )}
            </routerContext.Consumer>
        );
    },
    delete ({ open, task }) {
        return (
            <routerContext.Consumer>
                {routerContext => (
                    <TaskDialog
                        open={open}
                        onClose={() => task.drop()}
                        title={locale.delete}
                        actionLabel={locale.deleteButton}
                        run={() => task.runOnce().then(() => {
                            routerContext.navigate('/administrado/grupoj');
                        })}>
                        {locale.deleteAreYouSure}
                    </TaskDialog>
                )}
            </routerContext.Consumer>
        );
    },
    addCodeholder ({ open, task }) {
        return (
            <Dialog
                open={open}
                onClose={() => task.drop()}
                backdrop
                title="[[add codeholder]]"
                actions={[
                    {
                        label: '[[add]]',
                        action: () => {
                            // TODO
                        },
                    },
                ]}>
                codeholder picker goes here
            </Dialog>
        );
    },
    addClient ({ open, task }) {
        return (
            <Dialog
                open={open}
                onClose={() => task.drop()}
                backdrop
                title="[[add client]]"
                actions={[
                    {
                        label: '[[add]]',
                        action: () => {
                            // TODO
                        },
                    },
                ]}>
                client picker goes here
            </Dialog>
        );
    },
};
