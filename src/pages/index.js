import React, { lazy } from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';
import HomeIcon from '@material-ui/icons/Home';
import AssignmentIndIcon from '@material-ui/icons/AssignmentInd';
import AssessmentIcon from '@material-ui/icons/Assessment';
import BusinessIcon from '@material-ui/icons/Business';
import PaymentIcon from '@material-ui/icons/Payment';
import HowToVoteIcon from '@material-ui/icons/HowToVote';

/** A newspaper icon. */
export const NewspaperIcon = function NewspaperIcon () {
    return (
        <SvgIcon>
            <path fillRule="evenodd" fill="currentColor" d="M4 19a2 2 0 0 0 2-2V5h16v12a2 2 0 0 1-2 2H4zm4-7v4h5v-4H8zm7 0v4h5v-4h-5zM8 7v3h12V7H8z M4 19a2 2 0 0 1-2-2V7h3v10c0 1.1-.4 2-1 2z"/>
        </SvgIcon>
    );
};

// trailing commas are not allowed inside import()
/* eslint-disable comma-dangle */

/**
 * App routes.
 * IDs are `locale.pages[id]` keys and are also used to identify pages elsewhere.
 */
export default [
    {
        // TODO: proper grouping
        id: 'undefined',
        contents: [
            {
                id: 'home',
                icon: <HomeIcon />,
                url: '',
            },
            {
                id: 'members',
                component: lazy(() => import(
                    /* webpackChunkName: "members", webpackPrefetch: true */
                    './members/list'
                )),
                icon: <AssignmentIndIcon />,
                url: 'membroj',
                routes: [
                    {
                        component: lazy(() => import(
                            /* webpackChunkName: "members", webpackPrefetch: true */
                            './members/detail'
                        )),
                        url: /^(\d+)$/,
                    }
                ]
            },
            {
                id: 'magazines',
                icon: <NewspaperIcon />,
                url: 'revuoj',
            },
            {
                id: 'statistics',
                icon: <AssessmentIcon />,
                url: 'statistiko',
            },
            {
                id: 'congresses',
                icon: <BusinessIcon />,
                url: 'kongresoj',
            },
            {
                id: 'payments',
                icon: <PaymentIcon />,
                url: 'pagoj',
            },
            {
                id: 'elections',
                icon: <HowToVoteIcon />,
                url: 'vochdonado',
            },
        ],
    },
];
